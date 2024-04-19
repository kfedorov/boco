import { integer, sqliteTable, text, unique, primaryKey } from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';

export const Users = sqliteTable('user', {
    id: text('id').primaryKey().notNull(),
    username: text('username').notNull(),
    email: text('email').unique().notNull(),
    hashedPassword: text('hashed_password').notNull(),
    emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false)
});

export const Sessions = sqliteTable('session', {
    id: text('id').notNull().primaryKey(),
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
    userId: text('user_id')
        .notNull()
        .references(() => Users.id, { onDelete: 'cascade' })
});

export const Collectives = sqliteTable('collective', {
    id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    description: text('description').notNull()
});

export const CollectiveMembers = sqliteTable(
    'collective_member',
    {
        collectiveId: integer('collective_id')
            .references(() => Collectives.id)
            .notNull(),
        userId: text('user_id')
            .references(() => Users.id)
            .notNull(),
        role: text('role', { enum: ['member', 'manager', 'owner'] })
            .notNull()
            .default('member')
    },
    (table) => ({
        collectiveUserId: primaryKey({ columns: [table.collectiveId, table.userId] })
    })
);

export const CollectiveRelations = relations(Collectives, ({ many }) => {
    return {
        members: many(CollectiveMembers)
    };
});

export const UserRelations = relations(Users, ({ many }) => {
    return {
        collectives: many(CollectiveMembers)
    };
});

export const CollectiveMembersRelations = relations(CollectiveMembers, ({ one }) => {
    return {
        user: one(Users, {
            fields: [CollectiveMembers.userId],
            references: [Users.id]
        }),
        collective: one(Collectives, {
            fields: [CollectiveMembers.collectiveId],
            references: [Collectives.id]
        })
    };
});

export const EmailVerificationCodes = sqliteTable('email_verification_code', {
    id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
    code: text('code').notNull(),
    userId: text('user_id')
        .unique()
        .references(() => Users.id)
        .notNull(),
    email: text('email').notNull(),
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull()
});

export const Products = sqliteTable(
    'product',
    {
        id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
        provider: text('provider', { enum: ['tootsi', 'merci', 'other'] }).notNull(),
        name: text('name').notNull(),
        permalink: text('permalink'),
        externalId: text('external_id'),
        imageUrl: text('image_url'),
        externalSKU: text('external_SKU'),
        origin: text('origin'),
        organic: integer('organic', { mode: 'boolean' }).notNull().default(false),
        inStock: integer('in_stock', { mode: 'boolean' }).notNull().default(true)
    },
    (table) => {
        return {
            uniqueExternalIdPerProvider: unique('unique_external_id_per_provider').on(
                table.provider,
                table.externalId
            )
        };
    }
);

export const ProductRelations = relations(Products, ({ many }) => ({
    variants: many(ProductVariants)
}));

export const ProductVariants = sqliteTable(
    'product_variant',
    {
        id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
        productId: integer('product_id')
            .notNull()
            .references(() => Products.id, { onDelete: 'cascade' }),
        externalId: text('external_id'),
        name: text('name').notNull(),
        amountText: text('amount_text'),
        amountInG: integer('amount_in_g').notNull(),
        createdAt: integer('created_at', { mode: 'timestamp' })
            .default(sql`(strftime('%s', 'now'))`)
            .notNull(),
        current: integer('current', { mode: 'boolean' }).notNull().default(true)
    },
    (table) => {
        return {
            uniqueExternalIdPerProduct: unique('unique_external_id_per_product').on(
                table.productId,
                table.externalId
            )
        };
    }
);

export const ProductVariantRelations = relations(ProductVariants, ({ many, one }) => ({
    pricePoints: many(ProductVariantPricePoints),
    product: one(Products, {
        fields: [ProductVariants.productId],
        references: [Products.id]
    })
}));

export const ProductVariantPricePoints = sqliteTable('product_variant_price_points', {
    id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
    productVariantId: integer('product_variant_id')
        .notNull()
        .references(() => ProductVariants.id, { onDelete: 'cascade' }),
    createdAt: integer('created_at', { mode: 'timestamp' })
        .default(sql`(strftime('%s', 'now'))`)
        .notNull(),
    price: integer('price').notNull(), // price with 4 decimals e.g. 1.50$ = 15000.
    verifiedAt: integer('verified_at', { mode: 'timestamp' })
        .default(sql`(strftime('%s', 'now'))`)
        .notNull(),
    current: integer('active', { mode: 'boolean' }).notNull().default(true)
});

export const ProductVariantPricePointRelations = relations(
    ProductVariantPricePoints,
    ({ one }) => ({
        productVariant: one(ProductVariants, {
            fields: [ProductVariantPricePoints.productVariantId],
            references: [ProductVariants.id]
        })
    })
);
