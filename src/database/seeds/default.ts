import 'reflect-metadata';
import { hash } from 'bcrypt';
import dataSource from '../typeormFile';
import { User } from '../../user/user.entity';
import { Company } from '../../company/company.entity';
import { UserCompany } from '../../user-company/user-company.entity';
import { Role } from '../../common/role.enum';

const SEED_COMPANY_NAME = 'Binder-DF';
const SEED_COMPANY_DESCRIPTION = 'Unidade Binder Brasília-DF';

async function run() {
  await dataSource.initialize();

  try {
    const userRepository = dataSource.getRepository(User);
    const companyRepository = dataSource.getRepository(Company);
    const userCompanyRepository = dataSource.getRepository(UserCompany);

    const email = process.env.SEED_USER_EMAIL ?? 'admin@admin.com';
    const plainPassword = process.env.SEED_USER_PASSWORD ?? 'Admin@123';
    const name = process.env.SEED_USER_NAME ?? 'Admin Seed';

    const password = await hash(plainPassword, 10);

    let user = await userRepository.findOne({ where: { email } });

    if (user) {
      user.name = name;
      user.password = password;
      user.role = Role.Superadmin;
      user.isActive = true;
      await userRepository.save(user);
      console.log(`[seed] Usuario atualizado: ${email}`);
    } else {
      user = userRepository.create({
        name,
        email,
        password,
        role: Role.Superadmin,
        isActive: true,
      });
      await userRepository.save(user);
      console.log(`[seed] Usuario criado: ${email}`);
    }

    let company = await companyRepository.findOne({
      where: { name: SEED_COMPANY_NAME },
    });

    if (!company) {
      company = companyRepository.create({
        name: SEED_COMPANY_NAME,
        status: true,
        description: SEED_COMPANY_DESCRIPTION,
      });
      await companyRepository.save(company);
      console.log(`[seed] Empresa criada: ${SEED_COMPANY_NAME}`);
    } else {
      company.status = true;
      company.description = SEED_COMPANY_DESCRIPTION;
      await companyRepository.save(company);
      console.log(
        `[seed] Empresa ja existia, dados sincronizados: ${SEED_COMPANY_NAME}`,
      );
    }

    let userCompany = await userCompanyRepository.findOne({
      where: { user: { id: user.id }, company: { id: company.id } },
    });

    if (!userCompany) {
      userCompany = userCompanyRepository.create({
        user,
        company,
        status: true,
      });
      await userCompanyRepository.save(userCompany);
      console.log(`[seed] Usuario vinculado a empresa: ${SEED_COMPANY_NAME}`);
    } else {
      userCompany.status = true;
      await userCompanyRepository.save(userCompany);
      console.log(
        `[seed] Usuario ja vinculado a empresa: ${SEED_COMPANY_NAME}`,
      );
    }

    console.log('[seed] Finalizado com sucesso');
  } catch (error) {
    console.error('[seed] Erro ao executar seed', error);
    process.exitCode = 1;
  } finally {
    await dataSource.destroy();
  }
}

run();
