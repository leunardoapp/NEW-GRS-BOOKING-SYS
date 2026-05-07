import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { z } from 'zod';
import { db } from '@/src/db';
import { users } from '@/src/db/schema';
import { eq, or } from 'drizzle-orm';

const registerSchema = z.object({
  firstName: z.string().min(2, 'نام باید حداقل ۲ حرف باشد'),
  lastName: z.string().min(2, 'نام خانوادگی باید حداقل ۲ حرف باشد'),
  email: z.string().email('ایمیل نامعتبر است'),
  phone: z
    .string()
    .regex(/^09\d{9}$/, 'شماره موبایل باید با ۰۹ شروع شود و ۱۱ رقم باشد'),
  password: z.string().min(8, 'رمز عبور باید حداقل ۸ کاراکتر باشد'),
  nationalCode: z
    .string()
    .regex(/^\d{10}$/, 'کد ملی باید ۱۰ رقم باشد')
    .optional()
    .or(z.literal('')),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = registerSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return NextResponse.json(
        { success: false, message: 'خطا در اعتبارسنجی', errors },
        { status: 400 }
      );
    }

    const { firstName, lastName, email, phone, password, nationalCode } =
      validationResult.data;

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: or(
        eq(users.email, email.toLowerCase()),
        eq(users.phone, phone)
      ),
    });

    if (existingUser) {
      const field = existingUser.email === email.toLowerCase() ? 'ایمیل' : 'شماره موبایل';
      return NextResponse.json(
        {
          success: false,
          message: `این ${field} قبلا ثبت شده است`,
        },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hash(password, 12);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        firstName,
        lastName,
        email: email.toLowerCase(),
        phone,
        passwordHash,
        nationalCode: nationalCode || null,
        role: 'user',
        isActive: true,
      })
      .returning({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        phone: users.phone,
      });

    return NextResponse.json(
      {
        success: true,
        message: 'ثبت نام با موفقیت انجام شد',
        user: newUser,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در ثبت نام. لطفا دوباره تلاش کنید.' },
      { status: 500 }
    );
  }
}
