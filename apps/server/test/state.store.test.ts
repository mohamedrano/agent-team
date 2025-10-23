import { describe, expect, it, beforeEach } from "vitest";
import { MemoryStateStore, StateController, computeEtag } from "../src/state/store.js";

type TestSuitesState = {
  unit_tests?: Record<string, string[]>;
  integration_tests?: Record<string, string[]>;
  e2e_tests?: Record<string, string[]>;
};

const TEST_SUITES_KEY = "test_suites" as const;
const GENERATED_CODE_KEY = "generated_code" as const;

describe("MemoryStateStore", () => {
  let store: MemoryStateStore;

  beforeEach(() => {
    store = new MemoryStateStore();
  });

  it("validates payloads using the registered schema", async () => {
    const invalidPrd = {
      document_type: "Product Requirements Document",
      version: "1.0.0",
      created_at: "2024-01-01",
      executive_summary: {
        vision: "",
        target_users: "product teams",
        success_metrics: ["engagement"],
      },
      functional_requirements: [],
      non_functional_requirements: {},
      user_stories: [],
      out_of_scope: [],
    };

    await expect(store.set("prd_document" as const, invalidPrd)).rejects.toThrow(
      /Schema validation failed/
    );
  });

  it("merges nested objects deeply when requested", async () => {
    await store.set<TestSuitesState>(TEST_SUITES_KEY, {
      unit_tests: {
        login: ["should allow existing users"],
      },
      integration_tests: {
        onboarding: ["verifies signup flow"],
      },
    });

    const merged = await store.merge<TestSuitesState>(
      TEST_SUITES_KEY,
      {
        unit_tests: {
          registration: ["should allow new accounts"],
        },
        e2e_tests: {
          smoke: ["navigates critical journey"],
        },
      },
      { deep: true }
    );

    expect(merged.version).toBe(2);
    expect(merged.value.unit_tests).toEqual({
      login: ["should allow existing users"],
      registration: ["should allow new accounts"],
    });
    expect(merged.value.integration_tests?.onboarding).toEqual(["verifies signup flow"]);
    expect(merged.value.e2e_tests?.smoke).toEqual(["navigates critical journey"]);
  });

  it("redacts secrets in snapshots by default", async () => {
    await store.set(GENERATED_CODE_KEY, {
      env: {
        apiToken: "super-secret-token",
        nested: {
          clientSecret: "another-secret",
        },
      },
    });

    const snapshot = await store.snapshot(true);
    const data = snapshot.data[GENERATED_CODE_KEY] as any;

    expect(data.env.apiToken).toBe("***REDACTED***");
    expect(data.env.nested.clientSecret).toBe("***REDACTED***");
  });

  it("enforces optimistic concurrency using etags", async () => {
    const first = await store.set<TestSuitesState>(TEST_SUITES_KEY, {
      unit_tests: {
        login: ["happy path"],
      },
    });

    await store.set<TestSuitesState>(TEST_SUITES_KEY, {
      unit_tests: {
        login: ["happy path"],
        reset: ["handles reset"],
      },
    });

    await expect(
      store.set<TestSuitesState>(
        TEST_SUITES_KEY,
        {
          unit_tests: {
            login: ["should fail"],
          },
        },
        { expectedEtag: first.etag }
      )
    ).rejects.toThrow(/ETAG_MISMATCH/);
  });
});

describe("StateController", () => {
  let store: MemoryStateStore;
  let controller: StateController;

  beforeEach(() => {
    store = new MemoryStateStore();
    controller = new StateController(store);
  });

  it("writes, reads and performs CAS updates atomically", async () => {
    await controller.write<TestSuitesState>(
      TEST_SUITES_KEY,
      { unit_tests: { login: ["ok"] } },
      "qa_engineer"
    );

    const before = await controller.read<TestSuitesState>(TEST_SUITES_KEY);
    expect(before?.value.unit_tests?.login).toEqual(["ok"]);

    const after = await controller.cas<TestSuitesState>(
      TEST_SUITES_KEY,
      (current) => ({
        ...(current ?? {}),
        unit_tests: {
          ...(current?.unit_tests ?? {}),
          logout: ["protects session"],
        },
      }),
      "qa_engineer"
    );

    expect(after.version).toBe(2);
    expect(after.value.unit_tests?.login).toEqual(["ok"]);
    expect(after.value.unit_tests?.logout).toEqual(["protects session"]);

    const stored = await controller.read<TestSuitesState>(TEST_SUITES_KEY);
    expect(stored?.version).toBe(2);
  });
});

describe("computeEtag", () => {
  it("produces stable hashes for identical payloads and distinct versions", () => {
    const v1 = computeEtag({ foo: "bar" }, 1);
    const v2 = computeEtag({ foo: "bar" }, 1);
    const v3 = computeEtag({ foo: "bar" }, 2);

    expect(v1).toBe(v2);
    expect(v3).not.toBe(v1);
  });
});
