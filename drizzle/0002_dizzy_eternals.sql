CREATE TABLE `product_variant_price_points` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_variant_id` integer NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`price` integer NOT NULL,
	`verified_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`product_variant_id`) REFERENCES `product_variant`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `product_variant` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`external_id` text,
	`name` text NOT NULL,
	`amount_text` text,
	`amount_in_g` integer NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`current` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `product` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`provider` text NOT NULL,
	`name` text NOT NULL,
	`permalink` text,
	`external_id` text,
	`image_url` text,
	`external_SKU` text,
	`origin` text,
	`organic` integer DEFAULT false NOT NULL,
	`in_stock` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_external_id_per_product` ON `product_variant` (`product_id`,`external_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `unique_external_id_per_provider` ON `product` (`provider`,`external_id`);