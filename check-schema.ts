import { users } from "./drizzle/schema";
import { getTableColumns } from "drizzle-orm";

const columns = getTableColumns(users);
console.log("Users columns:", Object.keys(columns));
