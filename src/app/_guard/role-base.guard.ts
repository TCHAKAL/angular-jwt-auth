import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, UrlTree} from '@angular/router';
import {Observable} from 'rxjs';
import {AuthService} from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleBaseGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {
  }

  canActivate(
    route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    // Stage 1: check user authentication
    if (!this.authService.isAuthenticated) {
      this.router.navigate(['/auth/login']);
      this.authService.logout();
      return false;
    }
    const validRoles = route.data['authorities'] || [];
    const userData = this.authService.getUserData;

    // Stage 2: Check user role
    // Condition for multiple role
    // (!validRoles.some((r: string) => userData?.userInfo?.role.include(r)))
    if (!validRoles.some((r: string) => r === userData?.userInfo?.role)) {
      // this.router.navigate(['/error/403']); // Best place to send user
      this.router.navigate(['/']); // For this example case
      return false;
    }
    return true;
  }
}
