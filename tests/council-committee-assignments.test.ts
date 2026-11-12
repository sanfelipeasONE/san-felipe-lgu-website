import * as fs from "fs";
import * as path from "path";
import assert from "assert";
import { MUNICIPAL_OFFICIALS_DATA, CommitteeAssignment } from "../src/config/officials-data";

function runCouncilCommitteeAssignmentTests() {
  console.log("================================================================================");
  console.log("TEST SUITE: Municipal Council Committee Assignments Feature");
  console.log("================================================================================");

  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void) {
    try {
      fn();
      console.log(`  ✓ PASS: ${name}`);
      passed++;
    } catch (err: unknown) {
      console.error(`  ✗ FAIL: ${name} - ${(err as Error).message}`);
      failed++;
    }
  }

  const { executive, legislative } = MUNICIPAL_OFFICIALS_DATA;

  // -----------------------------------------------------------------------------
  // 1. Data Integrity: Profiles and Hierarchy Preservation
  // -----------------------------------------------------------------------------
  console.log("\n--- 1. Official Profiles & Hierarchy Preservation ---");

  test("Executive leadership (Mayor and Vice Mayor) preserved without duplicate records", () => {
    assert.strictEqual(executive.mayor.id, "mayor");
    assert.strictEqual(executive.mayor.name, "HON. REINHARD E. JERESANO");
    assert.strictEqual(executive.mayor.committeeAssignments, undefined, "Mayor has no committee assignments");

    assert.strictEqual(legislative.viceMayor.id, "vice-mayor");
    assert.strictEqual(legislative.viceMayor.name, "HON. MARY ANN R. QUIBA");
    assert.strictEqual(legislative.viceMayor.committeeAssignments?.length, 1);
    assert.deepStrictEqual(legislative.viceMayor.committeeAssignments?.[0], {
      name: "Committee on Legislative and Executive Affairs",
      designation: "Chairman",
    });
  });

  test("Exactly 8 regular Sangguniang Bayan councilors preserved in authoritative order", () => {
    assert.strictEqual(legislative.regularMembers.length, 8, "Must have exactly 8 regular members");
    const expected = [
      { id: "sb-member-1", name: "HON. ROBERT R. TORRES", order: 3 },
      { id: "sb-member-2", name: "HON. RONALD JETRO L. DE JESUS", order: 4 },
      { id: "sb-member-3", name: "HON. SIR ALFRED A. ABILLE", order: 5 },
      { id: "sb-member-4", name: "HON. ROSELYN MANGLICMOT", order: 6 },
      { id: "sb-member-5", name: "HON. REX DANIEL A. ASUTILLA", order: 7 },
      { id: "sb-member-6", name: "HON. RAMIL T. ABLIAN", order: 8 },
      { id: "sb-member-7", name: "HON. RAY A. FRONDARINA", order: 9 },
      { id: "sb-member-8", name: "HON. GARY MICHAEL P. FARIÑAS", order: 10 },
    ];

    expected.forEach((exp, idx) => {
      const member = legislative.regularMembers[idx];
      assert.strictEqual(member.id, exp.id);
      assert.strictEqual(member.name, exp.name);
      assert.strictEqual(member.order, exp.order);
      assert.strictEqual(member.isCommitteeVerified, true, `${member.name} committee must be verified`);
    });
  });

  test("Exactly 3 ex-officio members preserved in authoritative order", () => {
    assert.strictEqual(legislative.exOfficioMembers.length, 3, "Must have exactly 3 ex-officio members");
    assert.strictEqual(legislative.exOfficioMembers[0].id, "ex-officio-lbp");
    assert.strictEqual(legislative.exOfficioMembers[0].name, "HON. DANA F. DAMASO");
    assert.strictEqual(legislative.exOfficioMembers[0].order, 11);
    assert.strictEqual(legislative.exOfficioMembers[0].isCommitteeVerified, true);

    assert.strictEqual(legislative.exOfficioMembers[1].id, "ex-officio-skf");
    assert.strictEqual(legislative.exOfficioMembers[1].name, "HON. IVER-SON G. ALCANTARA");
    assert.strictEqual(legislative.exOfficioMembers[1].order, 12);
    assert.strictEqual(legislative.exOfficioMembers[1].isCommitteeVerified, true);

    assert.strictEqual(legislative.exOfficioMembers[2].id, "ex-officio-ipmr");
    assert.strictEqual(legislative.exOfficioMembers[2].name, "HON. NAPOLEON DOMINGO");
    assert.strictEqual(legislative.exOfficioMembers[2].order, 13);
    assert.strictEqual(legislative.exOfficioMembers[2].committeeAssignments, undefined);
    assert.strictEqual(legislative.exOfficioMembers[2].isCommitteeVerified, false);
  });

  // -----------------------------------------------------------------------------
  // 2. Specific Committee Assignments & Designations
  // -----------------------------------------------------------------------------
  console.log("\n--- 2. Committee-to-Councilor Assignments & Roles ---");

  test("Robert R. Torres assigned exactly 4 committees as Chairman", () => {
    const member = legislative.regularMembers.find((m) => m.id === "sb-member-1");
    assert(member, "sb-member-1 must exist");
    assert.strictEqual(member.committeeAssignments?.length, 4);
    assert.deepStrictEqual(member.committeeAssignments, [
      { name: "Committee on Finance, Budget and Appropriation", designation: "Chairman" },
      { name: "Committee on Rules and Privileges, Ordinance and Legal Matters", designation: "Chairman" },
      { name: "Committee on Good Government, Public Ethics and Accountability", designation: "Chairman" },
      { name: "Committee on Ways and Means", designation: "Chairman" },
    ]);
  });

  test("Roselyn Manglicmot assigned exactly 2 committees as Chairman", () => {
    const member = legislative.regularMembers.find((m) => m.id === "sb-member-4");
    assert(member, "sb-member-4 must exist");
    assert.strictEqual(member.committeeAssignments?.length, 2);
    assert.deepStrictEqual(member.committeeAssignments, [
      { name: "Committee on Women and Family", designation: "Chairman" },
      { name: "Committee on Health", designation: "Chairman" },
    ]);
  });

  test("Rex Daniel A. Asutilla assigned exactly 3 committees as Chairman", () => {
    const member = legislative.regularMembers.find((m) => m.id === "sb-member-5");
    assert(member, "sb-member-5 must exist");
    assert.strictEqual(member.committeeAssignments?.length, 3);
    assert.deepStrictEqual(member.committeeAssignments, [
      { name: "Committee on Justice and Human Rights", designation: "Chairman" },
      { name: "Committee on Trade, Commerce and Industry and Tourism", designation: "Chairman" },
      { name: "Committee on Housing and Land Utilization", designation: "Chairman" },
    ]);
  });

  test("Iver-son G. Alcantara assigned exactly 3 committees (2 Chairman, 1 Vice-Chairman)", () => {
    const member = legislative.exOfficioMembers.find((m) => m.id === "ex-officio-skf");
    assert(member, "ex-officio-skf must exist");
    assert.strictEqual(member.committeeAssignments?.length, 3);
    assert.deepStrictEqual(member.committeeAssignments, [
      { name: "Committee on Youth and Development", designation: "Chairman" },
      { name: "Committee on Education and Culture", designation: "Chairman" },
      { name: "Committee on Indigenous Folks", designation: "Vice-Chairman" },
    ]);
  });

  test("Ramil T. Ablian assigned exactly 3 committees as Chairman", () => {
    const member = legislative.regularMembers.find((m) => m.id === "sb-member-6");
    assert(member, "sb-member-6 must exist");
    assert.strictEqual(member.committeeAssignments?.length, 3);
    assert.deepStrictEqual(member.committeeAssignments, [
      { name: "Committee on Environmental Protection", designation: "Chairman" },
      { name: "Committee on Public Market/Public Mall and Slaughterhouse", designation: "Chairman" },
      { name: "Committee on Public Works and Infrastructure", designation: "Chairman" },
    ]);
  });

  test("Gary Michael P. Fariñas assigned exactly 3 committees as Chairman", () => {
    const member = legislative.regularMembers.find((m) => m.id === "sb-member-8");
    assert(member, "sb-member-8 must exist");
    assert.strictEqual(member.committeeAssignments?.length, 3);
    assert.deepStrictEqual(member.committeeAssignments, [
      { name: "Committee on Cooperatives", designation: "Chairman" },
      { name: "Committee on Agriculture", designation: "Chairman" },
      { name: "Committee on Administrative Investigation", designation: "Chairman" },
    ]);
  });

  test("Sir Alfred A. Abille assigned exactly 4 committees as Chairman", () => {
    const member = legislative.regularMembers.find((m) => m.id === "sb-member-3");
    assert(member, "sb-member-3 must exist");
    assert.strictEqual(member.committeeAssignments?.length, 4);
    assert.deepStrictEqual(member.committeeAssignments, [
      { name: "Committee on Peace and Order and Security", designation: "Chairman" },
      { name: "Committee on Fishing and Livelihood", designation: "Chairman" },
      { name: "Committee on Municipal Disaster Risk Reduction and Management", designation: "Chairman" },
      { name: "Committee on Social Welfare", designation: "Chairman" },
    ]);
  });

  test("Ronald Jetro L. De Jesus assigned exactly 3 committees as Chairman", () => {
    const member = legislative.regularMembers.find((m) => m.id === "sb-member-2");
    assert(member, "sb-member-2 must exist");
    assert.strictEqual(member.committeeAssignments?.length, 3);
    assert.deepStrictEqual(member.committeeAssignments, [
      { name: "Committee on Public Utilities, Facilities and Transportation", designation: "Chairman" },
      { name: "Committee on Games and Amusement", designation: "Chairman" },
      { name: "Committee on Information Technology", designation: "Chairman" },
    ]);
  });

  test("Dana F. Damaso assigned exactly 1 committee as Chairman", () => {
    const member = legislative.exOfficioMembers.find((m) => m.id === "ex-officio-lbp");
    assert(member, "ex-officio-lbp must exist");
    assert.strictEqual(member.committeeAssignments?.length, 1);
    assert.deepStrictEqual(member.committeeAssignments, [
      { name: "Committee on Barangay Affairs", designation: "Chairman" },
    ]);
  });

  test("Ray A. Frondarina assigned exactly 2 committees as Chairman", () => {
    const member = legislative.regularMembers.find((m) => m.id === "sb-member-7");
    assert(member, "sb-member-7 must exist");
    assert.strictEqual(member.committeeAssignments?.length, 2);
    assert.deepStrictEqual(member.committeeAssignments, [
      { name: "Committee on Labor and Employment", designation: "Chairman" },
      { name: "Committee on Senior Citizens", designation: "Chairman" },
    ]);
  });

  test("Hon. Napoleon Domingo has NO committee assignments (cleanly omitted)", () => {
    const member = legislative.exOfficioMembers.find((m) => m.id === "ex-officio-ipmr");
    assert(member, "ex-officio-ipmr must exist");
    assert.strictEqual(member.committeeAssignments, undefined, "Domingo must have undefined committeeAssignments");
  });

  // -----------------------------------------------------------------------------
  // 3. Council-wide Committee Universe (28 Council Committees + 1 Vice Mayor = 29 Total)
  // -----------------------------------------------------------------------------
  console.log("\n--- 3. Council-wide Committee Universe Validation ---");

  test("All 28 council committees + 1 Vice Mayor committee exist and are unique", () => {
    const allAssignments: { officialName: string; committee: CommitteeAssignment }[] = [];

    // Vice Mayor
    legislative.viceMayor.committeeAssignments?.forEach((c) => {
      allAssignments.push({ officialName: legislative.viceMayor.name, committee: c });
    });

    // Regular members
    legislative.regularMembers.forEach((m) => {
      m.committeeAssignments?.forEach((c) => {
        allAssignments.push({ officialName: m.name, committee: c });
      });
    });

    // Ex-officio members
    legislative.exOfficioMembers.forEach((m) => {
      m.committeeAssignments?.forEach((c) => {
        allAssignments.push({ officialName: m.name, committee: c });
      });
    });

    assert.strictEqual(allAssignments.length, 29, `Expected exactly 29 committee assignments, got ${allAssignments.length}`);

    // Verify all 29 committee names are unique
    const uniqueNames = new Set(allAssignments.map((a) => a.committee.name));
    assert.strictEqual(uniqueNames.size, 29, `Expected 29 unique committee names, got ${uniqueNames.size}`);

    // Verify designations strictly match "Chairman" or "Vice-Chairman"
    allAssignments.forEach((a) => {
      assert(
        a.committee.designation === "Chairman" || a.committee.designation === "Vice-Chairman",
        `Invalid designation ${a.committee.designation} on ${a.committee.name}`
      );
    });

    // Verify exact count of Vice-Chairman vs Chairman
    const viceChairmen = allAssignments.filter((a) => a.committee.designation === "Vice-Chairman");
    assert.strictEqual(viceChairmen.length, 1, "Only 1 committee has a Vice-Chairman designation (Indigenous Folks)");
    assert.strictEqual(viceChairmen[0].committee.name, "Committee on Indigenous Folks");
    assert.strictEqual(viceChairmen[0].officialName, "HON. IVER-SON G. ALCANTARA");

    const chairmen = allAssignments.filter((a) => a.committee.designation === "Chairman");
    assert.strictEqual(chairmen.length, 28, "28 committees have Chairman designation");
  });

  // -----------------------------------------------------------------------------
  // 4. UI Presentation & Component Structure
  // -----------------------------------------------------------------------------
  console.log("\n--- 4. UI Presentation & Component Structure ---");

  test("official-card.tsx correctly maps committee assignments in Executive, Councilor, and ExOfficio cards", () => {
    const cardPath = path.join(process.cwd(), "src/components/officials/official-card.tsx");
    const cardCode = fs.readFileSync(cardPath, "utf-8");

    // Check ExecutiveOfficialCard renders assignment designation and name
    assert(
      cardCode.includes("{assignment.designation} — {assignment.name}"),
      "ExecutiveOfficialCard must render assignment designation and name"
    );

    // Check CouncilorCard renders committee assignments list
    assert(
      cardCode.includes("Committee Assignments"),
      "CouncilorCard must include Committee Assignments heading/eyebrow"
    );
    assert(
      cardCode.includes("assignment.designation === \"Chairman\""),
      "CouncilorCard must differentiate Chairman and Vice-Chairman styling"
    );
    assert(
      cardCode.includes("bg-burgundy-700") && cardCode.includes("bg-amber-600"),
      "Must have burgundy dot for Chairman and amber dot for Vice-Chairman"
    );

    // Check ExOfficioCard renders committee assignments list
    assert(
      cardCode.includes("items-start"),
      "ExOfficioCard must use items-start alignment for clean card structure"
    );

    // Ensure no placeholder or pending text exists
    assert(
      !cardCode.includes("pending gazette"),
      "Card code must not contain 'pending gazette'"
    );
  });

  console.log("\n================================================================================");
  console.log(`COUNCIL COMMITTEE ASSIGNMENT TESTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runCouncilCommitteeAssignmentTests();
