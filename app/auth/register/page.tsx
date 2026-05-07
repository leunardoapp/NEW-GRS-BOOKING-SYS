'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Loader2, Hotel, Eye, EyeOff, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel, FieldError, FieldDescription } from '@/components/ui/field';

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  nationalCode?: string;
  general?: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    nationalCode: '',
  });

  const passwordRequirements = [
    { met: formData.password.length >= 8, text: 'حداقل ۸ کاراکتر' },
    { met: /[A-Z]/.test(formData.password), text: 'یک حرف بزرگ انگلیسی' },
    { met: /[a-z]/.test(formData.password), text: 'یک حرف کوچک انگلیسی' },
    { met: /[0-9]/.test(formData.password), text: 'یک عدد' },
  ];

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.firstName || formData.firstName.length < 2) {
      newErrors.firstName = 'نام باید حداقل ۲ حرف باشد';
    }

    if (!formData.lastName || formData.lastName.length < 2) {
      newErrors.lastName = 'نام خانوادگی باید حداقل ۲ حرف باشد';
    }

    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'ایمیل نامعتبر است';
    }

    if (!formData.phone || !/^09\d{9}$/.test(formData.phone)) {
      newErrors.phone = 'شماره موبایل باید با ۰۹ شروع شود و ۱۱ رقم باشد';
    }

    if (!formData.password || formData.password.length < 8) {
      newErrors.password = 'رمز عبور باید حداقل ۸ کاراکتر باشد';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'تکرار رمز عبور مطابقت ندارد';
    }

    if (formData.nationalCode && !/^\d{10}$/.test(formData.nationalCode)) {
      newErrors.nationalCode = 'کد ملی باید ۱۰ رقم باشد';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          nationalCode: formData.nationalCode || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          const fieldErrors: FormErrors = {};
          data.errors.forEach((err: { field: string; message: string }) => {
            fieldErrors[err.field as keyof FormErrors] = err.message;
          });
          setErrors(fieldErrors);
        } else {
          setErrors({ general: data.message || 'خطا در ثبت نام' });
        }
        return;
      }

      // Auto-login after successful registration
      const signInResult = await signIn('credentials', {
        identifier: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (signInResult?.ok) {
        router.push('/dashboard');
        router.refresh();
      } else {
        router.push('/auth/login?registered=true');
      }
    } catch {
      setErrors({ general: 'خطا در ثبت نام. لطفا دوباره تلاش کنید.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary rounded-lg">
              <Hotel className="h-8 w-8 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">یورزرو</span>
          </div>
          <p className="text-muted-foreground text-sm">سامانه رزرو آنلاین هتل</p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">ایجاد حساب کاربری</CardTitle>
            <CardDescription>
              برای رزرو هتل، ابتدا حساب کاربری خود را ایجاد کنید
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent>
              <FieldGroup>
                {errors.general && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                    <p className="text-destructive text-sm text-center">{errors.general}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <Field data-invalid={!!errors.firstName}>
                    <FieldLabel htmlFor="firstName">نام</FieldLabel>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="نام"
                      value={formData.firstName}
                      onChange={handleChange('firstName')}
                      disabled={isLoading}
                      required
                      aria-invalid={!!errors.firstName}
                    />
                    {errors.firstName && <FieldError>{errors.firstName}</FieldError>}
                  </Field>

                  <Field data-invalid={!!errors.lastName}>
                    <FieldLabel htmlFor="lastName">نام خانوادگی</FieldLabel>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="نام خانوادگی"
                      value={formData.lastName}
                      onChange={handleChange('lastName')}
                      disabled={isLoading}
                      required
                      aria-invalid={!!errors.lastName}
                    />
                    {errors.lastName && <FieldError>{errors.lastName}</FieldError>}
                  </Field>
                </div>

                <Field data-invalid={!!errors.email}>
                  <FieldLabel htmlFor="email">ایمیل</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@email.com"
                    value={formData.email}
                    onChange={handleChange('email')}
                    disabled={isLoading}
                    required
                    autoComplete="email"
                    dir="ltr"
                    className="text-left"
                    aria-invalid={!!errors.email}
                  />
                  {errors.email && <FieldError>{errors.email}</FieldError>}
                </Field>

                <Field data-invalid={!!errors.phone}>
                  <FieldLabel htmlFor="phone">شماره موبایل</FieldLabel>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                    value={formData.phone}
                    onChange={handleChange('phone')}
                    disabled={isLoading}
                    required
                    autoComplete="tel"
                    dir="ltr"
                    className="text-left"
                    aria-invalid={!!errors.phone}
                  />
                  {errors.phone && <FieldError>{errors.phone}</FieldError>}
                </Field>

                <Field data-invalid={!!errors.nationalCode}>
                  <FieldLabel htmlFor="nationalCode">
                    کد ملی <span className="text-muted-foreground font-normal">(اختیاری)</span>
                  </FieldLabel>
                  <Input
                    id="nationalCode"
                    type="text"
                    placeholder="۰۰۱۲۳۴۵۶۷۸"
                    value={formData.nationalCode}
                    onChange={handleChange('nationalCode')}
                    disabled={isLoading}
                    dir="ltr"
                    className="text-left"
                    aria-invalid={!!errors.nationalCode}
                  />
                  {errors.nationalCode && <FieldError>{errors.nationalCode}</FieldError>}
                </Field>

                <Field data-invalid={!!errors.password}>
                  <FieldLabel htmlFor="password">رمز عبور</FieldLabel>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="رمز عبور"
                      value={formData.password}
                      onChange={handleChange('password')}
                      disabled={isLoading}
                      required
                      autoComplete="new-password"
                      dir="ltr"
                      className="text-left pl-10"
                      aria-invalid={!!errors.password}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {formData.password && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {passwordRequirements.map((req, i) => (
                        <div
                          key={i}
                          className={`flex items-center gap-1.5 text-xs ${
                            req.met ? 'text-green-600' : 'text-muted-foreground'
                          }`}
                        >
                          {req.met ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <X className="h-3 w-3" />
                          )}
                          {req.text}
                        </div>
                      ))}
                    </div>
                  )}
                  {errors.password && <FieldError>{errors.password}</FieldError>}
                </Field>

                <Field data-invalid={!!errors.confirmPassword}>
                  <FieldLabel htmlFor="confirmPassword">تکرار رمز عبور</FieldLabel>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="تکرار رمز عبور"
                      value={formData.confirmPassword}
                      onChange={handleChange('confirmPassword')}
                      disabled={isLoading}
                      required
                      autoComplete="new-password"
                      dir="ltr"
                      className="text-left pl-10"
                      aria-invalid={!!errors.confirmPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <FieldError>{errors.confirmPassword}</FieldError>
                  )}
                </Field>

                <FieldDescription className="text-center">
                  با ثبت نام، شما{' '}
                  <Link href="/terms" className="text-primary hover:underline">
                    قوانین و مقررات
                  </Link>{' '}
                  سایت را می‌پذیرید.
                </FieldDescription>
              </FieldGroup>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" />
                    در حال ثبت نام...
                  </>
                ) : (
                  'ثبت نام'
                )}
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                قبلا ثبت نام کرده‌اید؟{' '}
                <Link
                  href="/auth/login"
                  className="text-primary hover:underline underline-offset-4 font-medium"
                >
                  وارد شوید
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
