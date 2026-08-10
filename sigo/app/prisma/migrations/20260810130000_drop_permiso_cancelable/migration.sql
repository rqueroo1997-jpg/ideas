-- `cancelable` was redundant with `estado` (pending states are cancelable,
-- everything else isn't) — derive it instead of maintaining a second field
-- that has to be kept in sync on every state transition.
ALTER TABLE "PermisoRequest" DROP COLUMN "cancelable";
