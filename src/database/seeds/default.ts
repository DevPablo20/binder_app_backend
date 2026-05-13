import 'reflect-metadata';
import { hash } from 'bcrypt';
import dataSource from '../typeormFile';
import { User } from '../../user/user.entity';
import { Role } from '../../auth/roles/roles.enum';

async function run() {
  await dataSource.initialize();

  try {
    const userRepository = dataSource.getRepository(User);

    const email = process.env.SEED_USER_EMAIL ?? 'admin@admin.com';
    const plainPassword = process.env.SEED_USER_PASSWORD ?? 'Admin@123';
    const name = process.env.SEED_USER_NAME ?? 'Admin Seed';

    const password = await hash(plainPassword, 10);

    const existingUser = await userRepository.findOne({ where: { email } });

    if (existingUser) {
      existingUser.name = name;
      existingUser.password = password;
      existingUser.role = Role.Superadmin;
      existingUser.isActive = true;
      await userRepository.save(existingUser);
      console.log(`[seed] Usuario atualizado: ${email}`);
    } else {
      const user = userRepository.create({
        name,
        email,
        password,
        role: Role.Superadmin,
        isActive: true,
      });
      await userRepository.save(user);
      console.log(`[seed] Usuario criado: ${email}`);
    }

    console.log('[seed] Finalizado com sucesso');
  } catch (error) {
    console.error('[seed] Erro ao executar seed', error);
    process.exitCode = 1;
  } finally {
    await dataSource.destroy();
  }
}

void run();