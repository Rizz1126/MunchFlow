CREATE TABLE "modifiers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"extra_price" double precision DEFAULT 0 NOT NULL,
	"business_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "sale_item_addons" DROP CONSTRAINT "sale_item_addons_sale_item_id_sale_items_id_fk";
--> statement-breakpoint
ALTER TABLE "sale_item_addons" DROP CONSTRAINT "sale_item_addons_addon_option_id_addon_options_id_fk";
--> statement-breakpoint
ALTER TABLE "sale_items" ADD COLUMN "modifiers_total" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "sale_items" ADD COLUMN "note" text;--> statement-breakpoint
ALTER TABLE "user_businesses" ADD COLUMN "accessible_menus" text;--> statement-breakpoint
ALTER TABLE "modifiers" ADD CONSTRAINT "modifiers_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;