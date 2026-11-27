import { Migration } from '@mikro-orm/migrations';

export class Migration20261126142412 extends Migration {

  override name = 'Migration20261126142412';

  override up(): void | Promise<void> {
    this.addSql(`alter table "users" alter column "created_at" set default now();`);
    this.addSql(`alter table "users" alter column "id" set default uuidv7();`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "users" alter column "id" drop default;`);
    this.addSql(`alter table "users" alter column "created_at" drop default;`);
  }

}
