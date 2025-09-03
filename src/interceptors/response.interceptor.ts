import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';

@Injectable()
export class SuccessResponseInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data: any) => {
        if (data?.meta) {
          return {
            success: true,
            message: data.message || 'Request successful',
            data: data.data,
            meta: data.meta,
          };
        }
        return {
          success: true,
          message: data?.message || 'Request successful',
          data: data?.data ?? data,
        };
      }),
    );
  }
}
