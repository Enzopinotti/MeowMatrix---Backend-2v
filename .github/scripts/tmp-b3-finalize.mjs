import fs from "node:fs";

const openApiPath = "modern/src/api/openapi.ts";
let source = fs.readFileSync(openApiPath, "utf8");
const oldProduct = '          "200": { description: "Product" },';
const newProduct = [
  '          "200": {',
  '            description: "Product",',
  '            content: {',
  '              "application/json": {',
  '                schema: {',
  '                  type: "object",',
  '                  required: ["data"],',
  '                  properties: { data: { $ref: "#/components/schemas/Product" } },',
  '                },',
  '              },',
  '            },',
  '          },',
].join("\n");
if (!source.includes(oldProduct)) {
  throw new Error("Product response anchor missing");
}
source = source.replace(oldProduct, newProduct);

const loginStart = source.indexOf("      LoginRequest: {");
const loginEnd = source.indexOf("      PasswordResetRequest: {", loginStart);
if (loginStart < 0 || loginEnd < 0) {
  throw new Error("LoginRequest OpenAPI block missing");
}
const loginBlock = source.slice(loginStart, loginEnd);
const oldLoginPolicy = "            minLength: 12,\n            maxLength: 128,";
const newLoginPolicy = "            minLength: 1,\n            maxLength: 4096,";
if (!loginBlock.includes(oldLoginPolicy)) {
  throw new Error("Login password OpenAPI anchor missing");
}
source =
  source.slice(0, loginStart) +
  loginBlock.replace(oldLoginPolicy, newLoginPolicy) +
  source.slice(loginEnd);
fs.writeFileSync(openApiPath, source);

const authPath = "modern/src/domain/auth.ts";
let auth = fs.readFileSync(authPath, "utf8");
const oldPublicUser = [
  "function publicUser(user: AuthUserRecord): UserDto {",
  "  const { passwordHash: _passwordHash, ...safeUser } = user;",
  "  return safeUser;",
  "}",
].join("\n");
const newPublicUser = [
  "function publicUser(user: AuthUserRecord): UserDto {",
  "  return {",
  "    id: user.id,",
  "    name: user.name,",
  "    lastName: user.lastName,",
  "    email: user.email,",
  "    role: user.role,",
  "    avatarUrl: user.avatarUrl,",
  "  };",
  "}",
].join("\n");
if (!auth.includes(oldPublicUser)) {
  throw new Error("publicUser anchor missing");
}
auth = auth.replace(oldPublicUser, newPublicUser);
fs.writeFileSync(authPath, auth);
