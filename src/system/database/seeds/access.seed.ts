import { hash } from 'bcrypt';
import { DataSource } from 'typeorm';
import { User } from '../../../access/user/user.entity';
import { Company } from '../../../access/company/company.entity';
import { UserCompany } from '../../../access/user-company/user-company.entity';
import { Role } from '../../../shared/role.enum';
import { logSeed } from './seed-helpers';
import { SEED_COMPANY_DESCRIPTION, SEED_COMPANY_NAME } from './seed-data';

export async function seedAccess(dataSource: DataSource): Promise<void> {
  logSeed('Iniciando seed da camada Access');

  const userRepository = dataSource.getRepository(User);
  const companyRepository = dataSource.getRepository(Company);
  const userCompanyRepository = dataSource.getRepository(UserCompany);

  const email = process.env.SEED_USER_EMAIL ?? 'pablo.jaber@binder.com.br';
  const plainPassword = process.env.SEED_USER_PASSWORD ?? 'Admin@123';
  const name = process.env.SEED_USER_NAME ?? 'Pablo Jaber';

  const password = await hash(plainPassword, 10);

  let user = await userRepository.findOne({ where: { email } });

  if (user) {
    user.name = name;
    user.password = password;
    user.role = Role.Superadmin;
    user.isActive = true;
    await userRepository.save(user);
    logSeed(`Usuario atualizado: ${email}`);
  } else {
    user = userRepository.create({
      name,
      email,
      password,
      role: Role.Superadmin,
      isActive: true,
    });
    await userRepository.save(user);
    logSeed(`Usuario criado: ${email}`);
  }

  let company = await companyRepository.findOne({
    where: { name: SEED_COMPANY_NAME },
  });

  if (!company) {
    company = companyRepository.create({
      name: SEED_COMPANY_NAME,
      isActive: true,
      description: SEED_COMPANY_DESCRIPTION,
    });
    await companyRepository.save(company);
    logSeed(`Empresa criada: ${SEED_COMPANY_NAME}`);
  } else {
    company.isActive = true;
    company.description = SEED_COMPANY_DESCRIPTION;
    await companyRepository.save(company);
    logSeed(`Empresa ja existia, dados sincronizados: ${SEED_COMPANY_NAME}`);
  }

  let userCompany = await userCompanyRepository.findOne({
    where: { user: { id: user.id }, company: { id: company.id } },
  });

  if (!userCompany) {
    userCompany = userCompanyRepository.create({
      user,
      company,
      isActive: true,
    });
    await userCompanyRepository.save(userCompany);
    logSeed(`Usuario vinculado a empresa: ${SEED_COMPANY_NAME}`);
  } else {
    userCompany.isActive = true;
    await userCompanyRepository.save(userCompany);
    logSeed(`Usuario ja vinculado a empresa: ${SEED_COMPANY_NAME}`);
  }

  logSeed('Seed da camada Access concluido');
}
