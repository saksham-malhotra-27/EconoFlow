import { Component, OnInit, ViewChild, TemplateRef  } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCheck, faCircleCheck, faCircleXmark, faFloppyDisk, faPenToSquare, faEnvelopeOpenText } from '@fortawesome/free-solid-svg-icons';
import { UserService } from '../../../core/services/user.service';
import { Observable } from 'rxjs';
import { User } from '../../../core/models/user';
import { AsyncPipe, CommonModule } from '@angular/common';
import { ApiErrorResponse } from '../../../core/models/error';
import { ErrorMessageService } from '../../../core/services/error-message.service';
import { passwordMatchValidator } from '../../../core/utils/custom-validators/password-match-validator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { CurrencyService } from '../../../core/services/currency.service';
import { MatIcon } from "@angular/material/icon";
import { MatDialogContent } from '@angular/material/dialog';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router'; 
import { TokenService } from 'src/app/core/services/token.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-detail-user',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AsyncPipe,
    ReactiveFormsModule,
    FontAwesomeModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatOptionModule,
    MatIcon,
    MatDialogContent,
    MatDialogModule,
  ],
  templateUrl: './detail-user.component.html',
  styleUrl: './detail-user.component.css'
})
export class DetailUserComponent implements OnInit {
  user$: Observable<User>;
  editingUser!: User;
  isEmailUpdated: boolean = false;
  isPasswordUpdated: boolean = false;
  passwordFormActive: boolean = false;
  deleteError: string | null =      null;
  deleteModalError: string | null = null;
  

  isModalOpen: boolean = false; 
  faCheck = faCheck;
  faCircleCheck = faCircleCheck;
  faCircleXmark = faCircleXmark;
  faFloppyDisk = faFloppyDisk;
  faPenToSquare = faPenToSquare;
  faEnvelopeOpenText = faEnvelopeOpenText;
  
  confirmationMessage: string = ''
  passwordForm!: FormGroup;
  userForm!: FormGroup;
  httpErrors = false;
  errors!: { [key: string]: string };
  hide = true;

  hasLowerCase = false;
  hasUpperCase = false;
  hasOneNumber = false;
  hasOneSpecial = false;
  hasMinCharacteres = false;
  @ViewChild('deleteDialog') deleteDialog!: TemplateRef<any>; // Reference the inline dialog templat
 
  constructor(private userService: UserService,private sanitizer: DomSanitizer, private tokenService: TokenService,  private router:Router, private dialog: MatDialog , private currencyService: CurrencyService, private errorMessageService: ErrorMessageService) {
    this.user$ = this.userService.loggedUser$;
  }

  ngOnInit(): void {
    this.reset();
    this.resetPasswordForm();
  }

  reset() {
    this.user$.subscribe(user => {
      this.userForm = new FormGroup({
        firstName: new FormControl(user.firstName, [Validators.required]),
        lastName: new FormControl(user.lastName, [Validators.required]),
        preferredCurrency: new FormControl(user.preferredCurrency, [Validators.required]),
        email: new FormControl(user.email, [Validators.required, Validators.email]),
      });

      this.editingUser = user;

      this.userForm.disable();
    });
  }

  resetPasswordForm() {
    this.passwordFormActive = false;
    this.passwordForm = new FormGroup({
      oldPassword: new FormControl('', [Validators.required]),
      password: new FormControl('', [Validators.required, Validators.pattern(/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_])(?!.* ).{8,}$/)]),
      confirmPassword: new FormControl('', [Validators.required])
    }, { validators: passwordMatchValidator });

    this.passwordForm.valueChanges.subscribe(value => {
      this.hasLowerCase = /[a-z]/.test(value.password);
      this.hasUpperCase = /[A-Z]/.test(value.password);
      this.hasOneNumber = /[0-9]/.test(value.password);
      this.hasOneSpecial = /[\W_]/.test(value.password);
      this.hasMinCharacteres = /^.{8,}$/.test(value.password);
    });
  }

  sanitizeMessage(message: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(message);
  }
  
  openDeleteDialog(): void {
    this.deleteError = null;
    this.deleteModalError = null;

    const dialogRef: MatDialogRef<any> = this.dialog.open(this.deleteDialog, {
      width: '400px',
    });
    const token = this.tokenService.getToken();
    const confirmationMessage = this.tokenService.getConfirmationMessage();
    if(confirmationMessage) this.confirmationMessage = confirmationMessage;
    if(!token){
    this.userService.deleteUser().subscribe({
      next: (response: any) => {
        if (response?.confirmationToken) {
          this.confirmationMessage = response.confirmationMessage; 
          this.tokenService.setToken(response.confirmationToken, response.confirmationMessage); 
        }
      },
      error: (err) => {
        console.error('Error during first deletion attempt:', err);
        this.deleteError = 'Failed to delete account. Please try again later';      
      },
    });
    }
    
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.confirmDeletion();
      }
    });
  }

  closeDialog(): void {
    this.deleteError = null;
    this.deleteModalError = null;
    this.dialog.closeAll();
  }

  confirmDeletion(): void {
    this.deleteModalError = null;
    const token = this.tokenService.getToken();
    if (token) {
      this.userService.deleteUser(token).subscribe({
        next: (response) => {
          this.dialog.closeAll(); 
          this.tokenService.clearToken(); 
          this.userService.removeUserInfo();
          this.router.navigate(['/login']);
        },
        error: (err) => {
          console.error('Error deleting user:', err);
          this.deleteModalError = 'Account deletion failed. Please log out, then log back in and try again';
        },
      });
    }
  }

  changeStatus() {
    if (this.userForm.disabled) {
      this.userForm.enable();
    }
  }

  get firstName() {
    return this.userForm.get('firstName');
  }
  get lastName() {
    return this.userForm.get('lastName');
  }
  get preferredCurrency() {
    return this.userForm.get('preferredCurrency');
  }
  get email() {
    return this.userForm.get('email');
  }

  get oldPassword() {
    return this.passwordForm.get('oldPassword');
  }
  get password() {
    return this.passwordForm.get('password');
  }
  get confirmPassword() {
    return this.passwordForm.get('confirmPassword');
  }

  save() {
    if (this.userForm.valid) {
      const firstName = this.firstName?.value;
      const lastName = this.lastName?.value;
      const email = this.email?.value;
      const preferredCurrency = this.preferredCurrency?.value;

      this.userForm.disable();

      if (firstName !== this.editingUser.firstName || lastName !== this.editingUser.lastName || preferredCurrency !== this.editingUser.preferredCurrency) {
        this.userService.setUserInfo(firstName, lastName, preferredCurrency).subscribe({
          next: response => { },
          error: (response: ApiErrorResponse) => {
            this.userForm.enable();
            this.httpErrors = true;
            this.errors = response.errors;

            this.errorMessageService.setFormErrors(this.userForm, this.errors);
          }
        });
      }

      if (email !== this.editingUser.email) {
        this.userService.manageInfo(email).subscribe({
          next: response => {
            this.isEmailUpdated = true;
          },
          error: (response: ApiErrorResponse) => {
            this.userForm.enable();
            this.httpErrors = true;
            this.errors = response.errors;

            this.errorMessageService.setFormErrors(this.userForm, this.errors);
          }
        });
      }
    }
  }

  savePassword() {
    if (this.passwordForm.valid) {
      const oldPassword = this.oldPassword?.value;
      const password = this.password?.value;

      this.passwordForm.disable();

      this.userService.manageInfo(undefined, password, oldPassword).subscribe({
        next: response => {
          this.isPasswordUpdated = true;
          this.passwordFormActive = false;
        },
        error: (response: ApiErrorResponse) => {
          this.passwordForm.enable();
          this.httpErrors = true;
          this.errors = response.errors;

          this.errorMessageService.setFormErrors(this.passwordForm, this.errors);
        }
      });

    }
  }

  getFormFieldErrors(form: FormGroup<any>, fieldName: string): string[] {
    const control = form.get(fieldName);
    const errors: string[] = [];

    if (control && control.errors) {
      for (const key in control.errors) {
        if (control.errors.hasOwnProperty(key)) {
          switch (key) {
            case 'required':
              errors.push('This field is required.');
              break;
            case 'email':
              errors.push('Invalid email format.');
              break;
            case 'pattern':
              errors.push('');
              break;
            default:
              errors.push(control.errors[key]);
          }
        }
      }
    }

    return errors;
  }

  showPasswordForm(): void {
    this.resetPasswordForm();
    this.passwordFormActive = true;
  }

  getCurrencies(): string[] {
    return this.currencyService.getAvailableCurrencies();
  }
}
