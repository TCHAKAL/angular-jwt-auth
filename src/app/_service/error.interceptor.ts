import {Injectable} from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import {catchError, Observable, throwError} from 'rxjs';
import {AuthService} from "../auth/auth.service";

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService) {
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(catchError((res) => this.errorHandler(res)));
  }

  private errorHandler(response: any): Observable<any> {
    // console.error('root error res', response)
    const status = response?.status;
    if (status === 401 || status === 403) {
      this.authService.logout();
    }
    const error = response.error;
    let message = response.message;
    if (typeof error === 'object') {
      const keys = Object.keys(error);
      if (keys.some(item => item === 'message')) {
        message = error.message;
      }
    } else if (typeof error === 'string') {
      message = error;
    }
    return throwError({message, status});
  }
}
