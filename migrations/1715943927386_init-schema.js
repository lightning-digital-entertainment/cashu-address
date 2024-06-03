/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  pgm.sql(`
CREATE OR REPLACE FUNCTION "public"."notify_payment"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$DECLARE
    v_pubkey TEXT;
    v_is_npub BOOLEAN;
    v_json TEXT;
BEGIN
        IF NOT (NEW."user" LIKE 'npub%') THEN
        v_is_npub := false;
        SELECT pubkey INTO v_pubkey FROM l_users WHERE name = NEW."user";
        ELSE
        v_is_npub := true;
        v_pubkey := NEW."user";
        END IF;
        v_json := json_build_object('is_npub', v_is_npub, 'pubkey', v_pubkey, 'amount', NEW.amount)::text;
        PERFORM pg_notify('payment_notifs', v_json);
    RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."notify_payment"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."notify_test"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$BEGIN
PERFORM pg_notify('notif_test', 'This is a test');
END;$$;

ALTER FUNCTION "public"."notify_test"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."notify_test_2"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$BEGIN
PERFORM pg_notify('notif_test', 'This is a test');
RETURN NEW;
END;$$;

ALTER FUNCTION "public"."notify_test_2"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";

CREATE TABLE IF NOT EXISTS "public"."l_alias_requests" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "pubkey" "text" NOT NULL,
    "payment_request" "text" NOT NULL,
    "alias" "text" NOT NULL,
    "status" "text" NOT NULL,
    "payment_hash" "text" NOT NULL,
    "amount" bigint NOT NULL
);

ALTER TABLE "public"."l_alias_requests" OWNER TO "postgres";

ALTER TABLE "public"."l_alias_requests" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."l_alias_requests_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


CREATE TABLE IF NOT EXISTS "public"."l_claims_3" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user" "text" NOT NULL,
    "mint_url" "text" NOT NULL,
    "proof" "jsonb" NOT NULL,
    "status" "text" NOT NULL,
    "transaction_id" bigint
);

ALTER TABLE "public"."l_claims_3" OWNER TO "postgres";

ALTER TABLE "public"."l_claims_3" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."l_claims_3_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."l_failed_payments" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "server_pr" "text" NOT NULL,
    "mint_pr" "text",
    "quote" "text",
    "user" "text" NOT NULL,
    "amount" integer NOT NULL,
    "transaction_id" bigint
);

ALTER TABLE "public"."l_failed_payments" OWNER TO "postgres";

ALTER TABLE "public"."l_failed_payments" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."l_failed_payments_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."l_inflight" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "owner_npub" "text" NOT NULL,
    "token" "text" NOT NULL
);

ALTER TABLE "public"."l_inflight" OWNER TO "postgres";

ALTER TABLE "public"."l_inflight" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."l_inflight_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."l_payments" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "pubkey" "text" NOT NULL,
    "amount" bigint NOT NULL,
    "transaction_id" bigint
);

ALTER TABLE "public"."l_payments" OWNER TO "postgres";

ALTER TABLE "public"."l_payments" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."l_payments_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."l_transactions" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "mint_pr" "text" NOT NULL,
    "mint_hash" "text" NOT NULL,
    "server_pr" "text" NOT NULL,
    "server_hash" "text" NOT NULL,
    "user" "text" DEFAULT ''::"text" NOT NULL,
    "zap_request" "jsonb",
    "fulfilled" boolean,
    "amount" bigint,
    "mint_url" "text" DEFAULT 'https://mint.minibits.cash/Bitcoin'::"text" NOT NULL
);

ALTER TABLE "public"."l_transactions" OWNER TO "postgres";

ALTER TABLE "public"."l_transactions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."l_transactions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."l_users" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "pubkey" "text" NOT NULL,
    "name" "text",
    "mint_url" "text" DEFAULT 'https://mint.minibits.cash/Bitcoin'::"text"
);

ALTER TABLE "public"."l_users" OWNER TO "postgres";

ALTER TABLE "public"."l_users" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."l_users_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

ALTER TABLE ONLY "public"."l_alias_requests"
    ADD CONSTRAINT "l_alias_requests_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."l_claims_3"
    ADD CONSTRAINT "l_claims_3_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."l_failed_payments"
    ADD CONSTRAINT "l_failed_payments_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."l_inflight"
    ADD CONSTRAINT "l_inflight_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."l_payments"
    ADD CONSTRAINT "l_payments_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."l_transactions"
    ADD CONSTRAINT "l_transactions_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."l_transactions"
    ADD CONSTRAINT "l_transactions_server_hash_key" UNIQUE ("server_hash");

ALTER TABLE ONLY "public"."l_users"
    ADD CONSTRAINT "l_users_name_key" UNIQUE ("name");

ALTER TABLE ONLY "public"."l_users"
    ADD CONSTRAINT "l_users_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."l_users"
    ADD CONSTRAINT "l_users_pubkey_key" UNIQUE ("pubkey");

CREATE OR REPLACE TRIGGER "notify_payment" AFTER UPDATE ON "public"."l_transactions" FOR EACH ROW EXECUTE FUNCTION "public"."notify_payment"();

ALTER TABLE ONLY "public"."l_claims_3"
    ADD CONSTRAINT "l_claims_3_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."l_transactions"("id");

ALTER TABLE ONLY "public"."l_failed_payments"
    ADD CONSTRAINT "public_l_failed_payments_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."l_transactions"("id");

ALTER TABLE ONLY "public"."l_payments"
    ADD CONSTRAINT "public_l_payments_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."l_transactions"("id") ON UPDATE CASCADE ON DELETE SET NULL;



GRANT USAGE ON SCHEMA "public" TO "postgres";


















ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";

`);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {};
