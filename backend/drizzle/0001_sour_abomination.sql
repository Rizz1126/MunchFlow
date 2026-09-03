CREATE TABLE "addon_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"menu_item_id" integer NOT NULL,
	"name" text NOT NULL,
	"is_required" boolean DEFAULT false NOT NULL,
	"max_select" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "addon_options" (
	"id" serial PRIMARY KEY NOT NULL,
	"addon_group_id" integer NOT NULL,
	"name" text NOT NULL,
	"extra_price" double precision DEFAULT 0 NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "addon_recipes" (
	"id" serial PRIMARY KEY NOT NULL,
	"addon_option_id" integer NOT NULL,
	"ingredient_id" integer NOT NULL,
	"quantity_needed" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "businesses" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"phone" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sale_item_addons" (
	"id" serial PRIMARY KEY NOT NULL,
	"sale_item_id" integer NOT NULL,
	"addon_option_id" integer NOT NULL,
	"extra_price" double precision DEFAULT 0 NOT NULL,
	"addon_name" text,
	"group_name" text
);
--> statement-breakpoint
CREATE TABLE "user_businesses" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"business_id" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cash_transactions" ADD COLUMN "business_id" integer;--> statement-breakpoint
ALTER TABLE "ingredients" ADD COLUMN "business_id" integer;--> statement-breakpoint
ALTER TABLE "menu_items" ADD COLUMN "business_id" integer;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "business_id" integer;--> statement-breakpoint
ALTER TABLE "addon_groups" ADD CONSTRAINT "addon_groups_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "addon_options" ADD CONSTRAINT "addon_options_addon_group_id_addon_groups_id_fk" FOREIGN KEY ("addon_group_id") REFERENCES "public"."addon_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "addon_recipes" ADD CONSTRAINT "addon_recipes_addon_option_id_addon_options_id_fk" FOREIGN KEY ("addon_option_id") REFERENCES "public"."addon_options"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "addon_recipes" ADD CONSTRAINT "addon_recipes_ingredient_id_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_item_addons" ADD CONSTRAINT "sale_item_addons_sale_item_id_sale_items_id_fk" FOREIGN KEY ("sale_item_id") REFERENCES "public"."sale_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_item_addons" ADD CONSTRAINT "sale_item_addons_addon_option_id_addon_options_id_fk" FOREIGN KEY ("addon_option_id") REFERENCES "public"."addon_options"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_businesses" ADD CONSTRAINT "user_businesses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_businesses" ADD CONSTRAINT "user_businesses_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_transactions" ADD CONSTRAINT "cash_transactions_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingredients" ADD CONSTRAINT "ingredients_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;