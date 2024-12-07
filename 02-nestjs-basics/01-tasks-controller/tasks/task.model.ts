import {Validate, IsString, IsNotEmpty, ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments} from 'class-validator';
import {genId} from '../genId';
import {PipeTransform, Injectable, ArgumentMetadata, BadRequestException} from '@nestjs/common';
import {validate} from 'class-validator';
import {plainToInstance} from 'class-transformer';

export enum TaskStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
}

const availableStatuses = Object.values(TaskStatus);

@ValidatorConstraint({name: 'status', async: false})
export class TaskStatusCheck implements ValidatorConstraintInterface {
  validate(text: TaskStatus,) {
    return availableStatuses.includes(text);
  }

  defaultMessage() {
    return `Task status can only be '${availableStatuses.join(', ')}'!`;
  }
}

const errorsToMessage = <T extends {value?: string, property: string; constraints?: {[key: string]: string}}>(errors: T[]) => {
  return errors.map(({value, property, constraints}) => {
    return {
      value, property, constraints
    }

  });
}

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  async transform(value: any, {metatype}: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }
    const object = plainToInstance(metatype, value);
    const errors = await validate(object);
    if (errors.length > 0) {
      throw new BadRequestException(errorsToMessage(errors));
    }
    return value;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}


export interface ITask {
  id?: string;
  title: string;
  description: string;
  status: TaskStatus;
}

export class TaskDto implements ITask {
  id?: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @Validate(TaskStatusCheck)
  status: TaskStatus;
}

export class Task extends TaskDto {
  constructor(task: Omit<ITask, 'id'>) {
    super();

    Object.assign(this, task);

    this.id = genId();
  }
}
