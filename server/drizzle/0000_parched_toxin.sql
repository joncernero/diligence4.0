CREATE TABLE "bulletin_reads" (
	"id" serial PRIMARY KEY NOT NULL,
	"bulletin_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"read_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bulletins" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"property_id" integer NOT NULL,
	"target_type" varchar(20) DEFAULT 'all' NOT NULL,
	"target_building_id" integer,
	"target_unit_number" varchar(50),
	"title" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"category" varchar(50) DEFAULT 'general',
	"is_archived" boolean DEFAULT false,
	"archived_at" timestamp,
	"push_sent" boolean DEFAULT false,
	"push_sent_at" timestamp,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"last_used_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "document_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_name" varchar(100) NOT NULL,
	"description" text,
	"icon_name" varchar(50),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "document_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_id" integer NOT NULL,
	"version_number" integer NOT NULL,
	"file_url" text NOT NULL,
	"file_key" text NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_size" bigint,
	"change_note" text,
	"uploaded_by" integer,
	"uploaded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "project_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"category_id" integer,
	"document_name" varchar(255) NOT NULL,
	"description" text,
	"file_url" text NOT NULL,
	"file_key" text NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_size" bigint,
	"mime_type" varchar(100),
	"version" integer DEFAULT 1,
	"parent_document_id" integer,
	"is_latest_version" boolean DEFAULT true,
	"linked_to_scope_id" integer,
	"tags" jsonb,
	"uploaded_by" integer,
	"uploaded_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"email_observation_assigned" boolean DEFAULT true,
	"email_task_reminder" boolean DEFAULT true,
	"email_task_overdue" boolean DEFAULT true,
	"email_walk_scheduled" boolean DEFAULT true,
	"email_document_uploaded" boolean DEFAULT false,
	"email_comment_added" boolean DEFAULT true,
	"in_app_observation_assigned" boolean DEFAULT true,
	"in_app_task_reminder" boolean DEFAULT true,
	"in_app_task_overdue" boolean DEFAULT true,
	"in_app_walk_scheduled" boolean DEFAULT true,
	"in_app_document_uploaded" boolean DEFAULT true,
	"in_app_comment_added" boolean DEFAULT true,
	"task_reminder_days_before" integer DEFAULT 1,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "notification_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"related_entity_type" varchar(50),
	"related_entity_id" integer,
	"action_url" text,
	"is_read" boolean DEFAULT false,
	"read_at" timestamp,
	"is_cleared" boolean DEFAULT false,
	"cleared_at" timestamp,
	"is_archived" boolean DEFAULT false,
	"archived_at" timestamp,
	"auto_clear_on_status" varchar(50),
	"email_sent" boolean DEFAULT false,
	"email_sent_at" timestamp,
	"push_sent" boolean DEFAULT false,
	"push_sent_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"project_name" varchar(255) NOT NULL,
	"project_number" varchar(50),
	"project_type" varchar(100),
	"project_status" varchar(50) NOT NULL,
	"project_department" varchar(100),
	"property_id" integer,
	"project_manager_id" integer,
	"superintendent_id" integer,
	"gc_org_id" integer,
	"client_org_id" integer,
	"start_date" date,
	"estimated_completion" date,
	"actual_completion" date,
	"total_budget" numeric(15, 2),
	"total_actual" numeric(15, 2),
	"created_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "projects_project_number_unique" UNIQUE("project_number")
);
--> statement-breakpoint
CREATE TABLE "buildings" (
	"id" serial PRIMARY KEY NOT NULL,
	"property_id" integer NOT NULL,
	"building_number" varchar(50) NOT NULL,
	"building_name" varchar(255),
	"total_units" integer,
	"floors" integer,
	"building_type" varchar(100),
	"square_footage" numeric(10, 2),
	"construction_type" varchar(100),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" serial PRIMARY KEY NOT NULL,
	"prop_name" varchar(255) NOT NULL,
	"prop_address" text NOT NULL,
	"prop_city" varchar(100),
	"prop_state" varchar(2),
	"prop_zip" varchar(10),
	"prop_county" varchar(100),
	"prop_parcel_number" varchar(100),
	"prop_type" varchar(100),
	"total_units" integer,
	"total_buildings" integer,
	"lot_size_acres" numeric(10, 2),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "units" (
	"id" serial PRIMARY KEY NOT NULL,
	"building_id" integer NOT NULL,
	"unit_number" varchar(50) NOT NULL,
	"unit_type" varchar(50),
	"floor_number" integer,
	"square_footage" numeric(10, 2),
	"is_standard" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "resident_invites" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"property_id" integer NOT NULL,
	"building_id" integer,
	"unit_number" varchar(50),
	"project_id" integer NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"invited_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "resident_invites_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "resident_units" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"property_id" integer NOT NULL,
	"building_id" integer,
	"unit_number" varchar(50),
	"project_id" integer NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "construction_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(20) NOT NULL,
	"title" varchar(255) NOT NULL,
	"division" varchar(5) NOT NULL,
	"division_title" varchar(255),
	"format_version" varchar(10) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "construction_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "observation_scope_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"observation_id" integer NOT NULL,
	"scope_item_id" integer NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "project_scope_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"scope_name" varchar(255) NOT NULL,
	"description" text,
	"csi_code_id" integer,
	"estimated_cost" numeric(12, 2),
	"actual_cost" numeric(12, 2),
	"status" varchar(50) DEFAULT 'planned' NOT NULL,
	"applies_to_unit_types" jsonb,
	"applies_to_all_units" boolean DEFAULT false,
	"start_date" timestamp,
	"completion_date" timestamp,
	"notes" text,
	"created_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "scope_item_materials" (
	"id" serial PRIMARY KEY NOT NULL,
	"scope_item_id" integer NOT NULL,
	"material_name" varchar(255) NOT NULL,
	"quantity" numeric(10, 2),
	"unit" varchar(50),
	"unit_cost" numeric(10, 2),
	"total_cost" numeric(12, 2),
	"supplier" varchar(255),
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "project_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"task_name" varchar(255) NOT NULL,
	"description" text,
	"task_type" varchar(50) NOT NULL,
	"scheduled_date" timestamp NOT NULL,
	"due_date" timestamp,
	"completed_date" timestamp,
	"assigned_to" integer,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"priority" varchar(50) DEFAULT 'medium',
	"linked_to_walk_id" integer,
	"notes" text,
	"created_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "building_unit_counts" (
	"id" serial PRIMARY KEY NOT NULL,
	"building_id" integer NOT NULL,
	"unit_type_id" integer NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "unit_type_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"property_id" integer NOT NULL,
	"type_name" varchar(100) NOT NULL,
	"bedrooms" integer NOT NULL,
	"bathrooms" numeric(3, 1) NOT NULL,
	"square_footage" integer,
	"floor_plan_url" text,
	"floor_plan_key" text,
	"finishes" jsonb,
	"amenities" jsonb,
	"notes" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_name" varchar(255) NOT NULL,
	"org_type" varchar(50) NOT NULL,
	"org_address" text,
	"org_phone" varchar(20),
	"org_email" varchar(255),
	"org_logo_url" text,
	"org_settings" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_project_access" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"project_id" integer NOT NULL,
	"access_level" varchar(50) NOT NULL,
	"can_view_financials" boolean DEFAULT false,
	"can_edit_budget" boolean DEFAULT false,
	"can_approve" boolean DEFAULT false,
	"granted_by" integer,
	"granted_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"user_email" varchar(255) NOT NULL,
	"user_password_hash" varchar(255) NOT NULL,
	"user_first" varchar(100) NOT NULL,
	"user_last" varchar(100) NOT NULL,
	"user_phone" varchar(20),
	"user_role" varchar(50) NOT NULL,
	"user_department" varchar(100),
	"user_permissions" jsonb,
	"is_active" boolean DEFAULT true,
	"last_login" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_user_email_unique" UNIQUE("user_email")
);
--> statement-breakpoint
CREATE TABLE "observation_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"observation_id" integer NOT NULL,
	"comment" text NOT NULL,
	"comment_type" varchar(50) DEFAULT 'comment',
	"user_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "observation_photos" (
	"id" serial PRIMARY KEY NOT NULL,
	"observation_id" integer NOT NULL,
	"photo_url" text NOT NULL,
	"photo_key" text,
	"file_name" varchar(255),
	"file_size" integer,
	"mime_type" varchar(100),
	"caption" text,
	"photo_type" varchar(50) DEFAULT 'before',
	"uploaded_by" integer,
	"uploaded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "observations" (
	"id" serial PRIMARY KEY NOT NULL,
	"walk_id" integer NOT NULL,
	"project_id" integer NOT NULL,
	"building_id" integer,
	"unit_id" integer,
	"location" varchar(255),
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"category" varchar(100),
	"severity" varchar(50),
	"assigned_to" integer,
	"assigned_to_org_id" integer,
	"trade_type" varchar(100),
	"status" varchar(50) DEFAULT 'open' NOT NULL,
	"priority" varchar(50),
	"due_date" date,
	"resolved_at" timestamp,
	"verified_at" timestamp,
	"created_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "property_walks" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"property_id" integer NOT NULL,
	"walk_date" timestamp NOT NULL,
	"walk_type" varchar(100) NOT NULL,
	"walk_status" varchar(50) DEFAULT 'scheduled' NOT NULL,
	"conducted_by" integer,
	"attendees" jsonb,
	"notes" text,
	"weather_conditions" varchar(255),
	"created_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "bulletin_reads" ADD CONSTRAINT "bulletin_reads_bulletin_id_bulletins_id_fk" FOREIGN KEY ("bulletin_id") REFERENCES "public"."bulletins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bulletin_reads" ADD CONSTRAINT "bulletin_reads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bulletins" ADD CONSTRAINT "bulletins_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_document_id_project_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."project_documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_documents" ADD CONSTRAINT "project_documents_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_documents" ADD CONSTRAINT "project_documents_category_id_document_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."document_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_documents" ADD CONSTRAINT "project_documents_linked_to_scope_id_project_scope_items_id_fk" FOREIGN KEY ("linked_to_scope_id") REFERENCES "public"."project_scope_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_documents" ADD CONSTRAINT "project_documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_project_manager_id_users_id_fk" FOREIGN KEY ("project_manager_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_superintendent_id_users_id_fk" FOREIGN KEY ("superintendent_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_gc_org_id_organizations_id_fk" FOREIGN KEY ("gc_org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_client_org_id_organizations_id_fk" FOREIGN KEY ("client_org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buildings" ADD CONSTRAINT "buildings_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_building_id_buildings_id_fk" FOREIGN KEY ("building_id") REFERENCES "public"."buildings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resident_invites" ADD CONSTRAINT "resident_invites_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resident_units" ADD CONSTRAINT "resident_units_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observation_scope_links" ADD CONSTRAINT "observation_scope_links_observation_id_observations_id_fk" FOREIGN KEY ("observation_id") REFERENCES "public"."observations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observation_scope_links" ADD CONSTRAINT "observation_scope_links_scope_item_id_project_scope_items_id_fk" FOREIGN KEY ("scope_item_id") REFERENCES "public"."project_scope_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_scope_items" ADD CONSTRAINT "project_scope_items_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_scope_items" ADD CONSTRAINT "project_scope_items_csi_code_id_construction_codes_id_fk" FOREIGN KEY ("csi_code_id") REFERENCES "public"."construction_codes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scope_item_materials" ADD CONSTRAINT "scope_item_materials_scope_item_id_project_scope_items_id_fk" FOREIGN KEY ("scope_item_id") REFERENCES "public"."project_scope_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_linked_to_walk_id_property_walks_id_fk" FOREIGN KEY ("linked_to_walk_id") REFERENCES "public"."property_walks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "building_unit_counts" ADD CONSTRAINT "building_unit_counts_unit_type_id_unit_type_templates_id_fk" FOREIGN KEY ("unit_type_id") REFERENCES "public"."unit_type_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unit_type_templates" ADD CONSTRAINT "unit_type_templates_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_project_access" ADD CONSTRAINT "user_project_access_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_project_access" ADD CONSTRAINT "user_project_access_granted_by_users_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observation_comments" ADD CONSTRAINT "observation_comments_observation_id_observations_id_fk" FOREIGN KEY ("observation_id") REFERENCES "public"."observations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observation_comments" ADD CONSTRAINT "observation_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observation_photos" ADD CONSTRAINT "observation_photos_observation_id_observations_id_fk" FOREIGN KEY ("observation_id") REFERENCES "public"."observations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observation_photos" ADD CONSTRAINT "observation_photos_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observations" ADD CONSTRAINT "observations_walk_id_property_walks_id_fk" FOREIGN KEY ("walk_id") REFERENCES "public"."property_walks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observations" ADD CONSTRAINT "observations_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observations" ADD CONSTRAINT "observations_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observations" ADD CONSTRAINT "observations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_walks" ADD CONSTRAINT "property_walks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_walks" ADD CONSTRAINT "property_walks_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_walks" ADD CONSTRAINT "property_walks_conducted_by_users_id_fk" FOREIGN KEY ("conducted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_walks" ADD CONSTRAINT "property_walks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;