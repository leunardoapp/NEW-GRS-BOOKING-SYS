import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { hash } from 'bcryptjs';
import * as schema from './schema';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/youreserve';

async function seed() {
  console.log('Starting database seed...');

  const pool = new Pool({
    connectionString: DATABASE_URL,
  });

  const db = drizzle(pool, { schema });

  try {
    // Create admin user
    const adminPasswordHash = await hash('Admin@123', 12);
    
    const existingAdmin = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, 'admin@youreserve.ir'),
    });

    if (!existingAdmin) {
      await db.insert(schema.users).values({
        email: 'admin@youreserve.ir',
        phone: '09120000000',
        passwordHash: adminPasswordHash,
        firstName: 'مدیر',
        lastName: 'سیستم',
        role: 'admin',
        isActive: true,
      });
      console.log('Admin user created: admin@youreserve.ir / Admin@123');
    } else {
      console.log('Admin user already exists');
    }

    // Insert default system config values
    const defaultConfigs = [
      { key: 'site_name', value: 'یورزرو', description: 'نام سایت' },
      { key: 'site_tagline', value: 'سامانه رزرو آنلاین هتل', description: 'شعار سایت' },
      { key: 'contact_email', value: 'info@youreserve.ir', description: 'ایمیل تماس' },
      { key: 'contact_phone', value: '02112345678', description: 'تلفن تماس' },
      { key: 'sms_booking_template', value: 'مهمان گرامی، رزرو شما با کد {code} در هتل {hotel} از تاریخ {checkin} تا {checkout} ثبت شد.', description: 'قالب پیامک رزرو' },
      { key: 'sms_cancel_template', value: 'مهمان گرامی، رزرو شما با کد {code} لغو شد.', description: 'قالب پیامک لغو' },
      { key: 'sms_otp_template', value: 'کد تایید شما: {code}', description: 'قالب پیامک OTP' },
    ];

    for (const config of defaultConfigs) {
      const existing = await db.query.systemConfig.findFirst({
        where: (systemConfig, { eq }) => eq(systemConfig.key, config.key),
      });

      if (!existing) {
        await db.insert(schema.systemConfig).values(config);
        console.log(`Config created: ${config.key}`);
      }
    }

    console.log('Database seed completed successfully!');
  } catch (error) {
    console.error('Seed error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

seed().catch(console.error);
