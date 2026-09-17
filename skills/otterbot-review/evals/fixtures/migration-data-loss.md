# PR fixture: split customer name into first and last

Synthetic SQL migration PR. Both statements are new and run in order inside
one deployment step. The `customers` table has millions of rows and the
`full_name` column is populated for every row. There is no backup step and
the migration tool does not wrap statements in a transaction. Nobody has
signed off on the migration.

```sql
ALTER TABLE customers DROP COLUMN full_name;
UPDATE customers
   SET first_name = split_part(full_name, ' ', 1),
       last_name  = split_part(full_name, ' ', 2);
```
