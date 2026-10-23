"use strict";

/**
 * ============================================================================
 * DATA STRUCTURES MINI PROJECT: POLYNOMIAL CALCULATOR USING SINGLY LINKED LIST
 * ============================================================================
 * Student: Ankur Patil
 *
 * Core Concept:
 * Every non-zero term (coeff * x^exp) of a polynomial is stored as one Node
 * in a genuine Singly Linked List.
 *
 * Linked List Invariants:
 * 1. Strictly sorted in descending order of exponents:
 *    head -> [c1 | e1 | next] -> [c2 | e2 | next] -> ... -> NULL, with e1 > e2 > ...
 * 2. Terms with a coefficient of zero are NEVER stored.
 * 3. Like terms (same exponent) are merged during insertion.
 * 4. Add / Subtract / Multiply / Differentiate / Evaluate all work by walking
 *    the nodes with pointers (ptrA, ptrB) exactly like a C/C++ implementation.
 * ============================================================================
 */

/* ============================================================================
 * 1. CORE DATA STRUCTURE
 * ========================================================================== */

/** One term of the polynomial: coeff * x^exp */
class Node {
  constructor(coeff, exp) {
    this.coeff = cleanNumber(coeff);
    this.exp = exp;
    this.next = null;
  }
}

/** Polynomial stored as a singly linked list (head = highest exponent). */
class Polynomial {
  constructor() {
    this.head = null;
  }

  /**
   * insertTerm(coeff, exp)
   * Inserts in descending-exponent order. Same exponent -> coefficients are
   * combined; if the sum becomes 0 the node is unlinked. coeff 0 -> no node.
   */
  insertTerm(coeff, exp) {
    coeff = cleanNumber(coeff);
    if (!Number.isFinite(coeff) || !Number.isInteger(exp)) {
      throw new Error("Invalid term: coefficient must be finite and exponent must be an integer.");
    }
    if (coeff === 0) return;

    let prev = null;
    let curr = this.head;
    while (curr !== null && curr.exp > exp) {
      prev = curr;
      curr = curr.next;
    }

    // Like term already present -> merge
    if (curr !== null && curr.exp === exp) {
      curr.coeff = cleanNumber(curr.coeff + coeff);
      if (curr.coeff === 0) {
        if (prev === null) this.head = curr.next;
        else prev.next = curr.next;
      }
      return;
    }

    // New exponent -> link a new node between prev and curr
    const newNode = new Node(coeff, exp);
    newNode.next = curr;
    if (prev === null) this.head = newNode;
    else prev.next = newNode;
  }

  /** Number of nodes (walks the list). */
  get length() {
    let count = 0;
    let curr = this.head;
    while (curr !== null) {
      count++;
      curr = curr.next;
    }
    return count;
  }

  /** Standard mathematical notation, e.g. "3x^2 - x + 4". Empty list -> "0". */
  toString() {
    if (!this.head) return "0";
    let str = "";
    let curr = this.head;

    while (curr !== null) {
      const coeff = cleanNumber(curr.coeff);
      const absCoeff = Math.abs(coeff);
      const exp = curr.exp;

      let varStr = "";
      if (exp > 1) varStr = `x^${exp}`;
      else if (exp === 1) varStr = "x";

      let coeffStr;
      if (exp === 0) coeffStr = formatNumber(absCoeff);
      else coeffStr = Math.abs(absCoeff - 1) < 1e-10 ? "" : formatNumber(absCoeff);

      const term = coeffStr + varStr;
      if (str === "") str = (coeff < 0 ? "-" : "") + term;
      else str += (coeff < 0 ? " - " : " + ") + term;

      curr = curr.next;
    }
    return str || "0";
  }
}

/* ============================================================================
 * 2. HELPER UTILITIES
 * ========================================================================== */

function cleanNumber(n) {
  if (typeof n !== "number" || !Number.isFinite(n)) return 0;
  return Math.abs(n) < 1e-10 ? 0 : Number(n.toFixed(8));
}

function formatNumber(n) {
  n = cleanNumber(n);
  if (Number.isInteger(n)) return String(n);
  return Number(n.toPrecision(7)).toString();
}

/** Single term text, e.g. formatTerm(-3, 2) -> "-3x^2" */
function formatTerm(coeff, exp) {
  coeff = cleanNumber(coeff);
  if (coeff === 0) return "0";
  const absCoeff = Math.abs(coeff);
  const sign = coeff < 0 ? "-" : "";
  if (exp === 0) return `${sign}${formatNumber(absCoeff)}`;
  const varPart = exp === 1 ? "x" : `x^${exp}`;
  const numPart = Math.abs(absCoeff - 1) < 1e-10 ? "" : formatNumber(absCoeff);
  return `${sign}${numPart}${varPart}`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Plain-array copy of a list, used by the recorded animation steps. */
function getPolySnapshot(poly) {
  const snapshot = [];
  let curr = poly.head;
  while (curr !== null) {
    snapshot.push({ coeff: curr.coeff, exp: curr.exp });
    curr = curr.next;
  }
  return snapshot;
}

/** Exponent of the tail node (or null for an empty list). */
function getLastExp(poly) {
  if (!poly || !poly.head) return null;
  let curr = poly.head;
  while (curr.next !== null) curr = curr.next;
  return curr.exp;
}

/** Find the node with a given exponent (or null). */
function findNode(poly, exp) {
  let curr = poly.head;
  while (curr !== null) {
    if (curr.exp === exp) return curr;
    curr = curr.next;
  }
  return null;
}

/* ============================================================================
 * 3. STEP GENERATORS (every operation pre-records its snapshots)
 * ========================================================================== */

/**
 * Records one animation step.
 * f.ptrA / f.ptrB are the Node objects the pointers currently reference (or null).
 */
function recordStep(steps, result, f) {
  steps.push({
    title: f.title,
    desc: f.desc,
    math: f.math || "",
    ptrAExp: f.ptrA ? f.ptrA.exp : null,
    ptrBExp: f.ptrB ? f.ptrB.exp : null,
    resultTailExp: result ? getLastExp(result) : null,
    activeResultExp: f.active === undefined ? null : f.active,
    isMergeFlash: !!f.flash,
    resultSnapshot: f.snapshot || (result ? getPolySnapshot(result) : []),
    isFinished: !!f.done
  });
}

/** ADDITION / SUBTRACTION: two-pointer merge of two sorted linked lists. */
function generateMergeSteps(polyA, polyB, isSub) {
  const sym = isSub ? "−" : "+";
  const steps = [];
  const result = new Polynomial();

  recordStep(steps, result, {
    title: isSub ? "Start Subtraction: A(x) − B(x)" : "Start Addition (Two-Pointer Merge Algorithm)",
    desc: isSub
      ? "ptr A and ptr B start at the heads of A and B; the result list is empty. Terms taken from B have their sign reversed (c_A − c_B)."
      : "ptr A points to the head of Polynomial A, ptr B to the head of Polynomial B. The result list starts empty.",
    math: `A(x) = ${polyA.toString()}   |   B(x) = ${polyB.toString()}`,
    ptrA: polyA.head,
    ptrB: polyB.head
  });

  let ptrA = polyA.head;
  let ptrB = polyB.head;

  while (ptrA !== null || ptrB !== null) {
    if (ptrA !== null && (ptrB === null || ptrA.exp > ptrB.exp)) {
      // Take the term from A
      const t = formatTerm(ptrA.coeff, ptrA.exp);
      result.insertTerm(ptrA.coeff, ptrA.exp);
      recordStep(steps, result, {
        title: ptrB ? `Compare Exponents: exp ${ptrA.exp} > exp ${ptrB.exp}` : "Poly B Exhausted (NULL)",
        desc: ptrB
          ? `ptr A has a higher power (${ptrA.exp} > ${ptrB.exp}). Copy term ${t} from Poly A into the result list, then advance ptr A.`
          : `ptr B is NULL. Copy the remaining term ${t} from Poly A into the result list, then advance ptr A.`,
        math: `Copy ${t} to result`,
        ptrA, ptrB, active: ptrA.exp
      });
      ptrA = ptrA.next;
    } else if (ptrB !== null && (ptrA === null || ptrB.exp > ptrA.exp)) {
      // Take the term from B (sign reversed for subtraction)
      const bc = cleanNumber(isSub ? -ptrB.coeff : ptrB.coeff);
      const t = formatTerm(bc, ptrB.exp);
      result.insertTerm(bc, ptrB.exp);
      const lead = ptrA ? `ptr B has a higher power (${ptrB.exp} > ${ptrA.exp}). ` : "ptr A is NULL. ";
      const action = isSub
        ? `Negate B's coefficient and append ${t} to the result list`
        : `Copy term ${t} from Poly B into the result list`;
      recordStep(steps, result, {
        title: ptrA ? `Compare Exponents: exp ${ptrB.exp} > exp ${ptrA.exp}` : "Poly A Exhausted (NULL)",
        desc: `${lead}${action}, then advance ptr B.`,
        math: isSub
          ? `Append −(${formatTerm(ptrB.coeff, ptrB.exp)}) = ${t} to result`
          : `Copy ${t} to result`,
        ptrA, ptrB, active: ptrB.exp
      });
      ptrB = ptrB.next;
    } else {
      // Equal exponents: combine coefficients
      const exp = ptrA.exp;
      const combined = cleanNumber(isSub ? ptrA.coeff - ptrB.coeff : ptrA.coeff + ptrB.coeff);
      const expr = `(${formatTerm(ptrA.coeff, exp)}) ${sym} (${formatTerm(ptrB.coeff, exp)})`;
      if (combined !== 0) {
        result.insertTerm(combined, exp);
        recordStep(steps, result, {
          title: `Equal Exponents: exp ${exp} == exp ${exp}`,
          desc: `Both pointers point to exponent ${exp}. ${isSub ? "Subtract" : "Add"} coefficients: (${ptrA.coeff}) ${sym} (${ptrB.coeff}) = ${combined}. Insert the combined term ${formatTerm(combined, exp)} into the result list and advance both pointers.`,
          math: `${expr} = ${formatTerm(combined, exp)}`,
          ptrA, ptrB, active: exp
        });
      } else {
        recordStep(steps, result, {
          title: `Equal Exponents Cancel Out: exp ${exp}`,
          desc: `Both nodes have exponent ${exp}. The coefficients cancel: (${ptrA.coeff}) ${sym} (${ptrB.coeff}) = 0. Zero-coefficient terms are never stored, so no node is created. Advance both pointers.`,
          math: `${expr} = 0 (node omitted)`,
          ptrA, ptrB, active: null
        });
      }
      ptrA = ptrA.next;
      ptrB = ptrB.next;
    }
  }

  recordStep(steps, result, {
    title: `${isSub ? "Subtraction" : "Addition"} Complete ✓`,
    desc: `Both pointers have reached NULL. The sorted lists were merged in O(m + n) time. Final result: ${result.toString()}.`,
    math: `Result: ${result.toString()}`,
    done: true
  });

  return { result, steps };
}

/** MULTIPLICATION: term-by-term products inserted with like-term merging. */
function generateMultiplicationSteps(polyA, polyB) {
  const steps = [];
  const result = new Polynomial();

  recordStep(steps, result, {
    title: "Start Multiplication: A(x) × B(x)",
    desc: "Take every node of A and multiply it by every node of B using (a·x^m)(b·x^n) = (a·b)·x^(m+n). Each product is inserted into the result list; equal exponents are merged.",
    math: `A(x) = ${polyA.toString()}   |   B(x) = ${polyB.toString()}`,
    ptrA: polyA.head,
    ptrB: polyB.head
  });

  if (!polyA.head || !polyB.head) {
    recordStep(steps, result, {
      title: "Zero Polynomial Product",
      desc: "One of the polynomials has no non-zero terms (it is 0), so the product is 0.",
      math: "Result = 0",
      done: true
    });
    return { result, steps };
  }

  let pairIndex = 1;
  for (let ptrA = polyA.head; ptrA !== null; ptrA = ptrA.next) {
    for (let ptrB = polyB.head; ptrB !== null; ptrB = ptrB.next) {
      const prodCoeff = cleanNumber(ptrA.coeff * ptrB.coeff);
      const prodExp = ptrA.exp + ptrB.exp;
      const prodText = formatTerm(prodCoeff, prodExp);
      const pairText = `(${formatTerm(ptrA.coeff, ptrA.exp)}) × (${formatTerm(ptrB.coeff, ptrB.exp)})`;

      const existing = findNode(result, prodExp);
      const oldCoeff = existing ? existing.coeff : 0; // capture BEFORE insertion mutates the node
      result.insertTerm(prodCoeff, prodExp);

      if (prodCoeff === 0) {
        recordStep(steps, result, {
          title: `Pair #${pairIndex}: Product is 0`,
          desc: `${pairText} = 0, so no node is created.`,
          math: `${pairText} = 0`,
          ptrA, ptrB, active: null
        });
      } else if (existing) {
        const after = findNode(result, prodExp);
        const newCoeff = after ? after.coeff : 0;
        recordStep(steps, result, {
          title: `Pair #${pairIndex}: Like Power Merged (x^${prodExp})`,
          desc: `${pairText} = ${prodText}. A node with exponent ${prodExp} already exists in the result (${formatTerm(oldCoeff, prodExp)}). Merge: (${oldCoeff}) + (${prodCoeff}) = ${newCoeff}.${newCoeff === 0 ? " The sum is 0, so that node is removed." : ""}`,
          math: `${pairText}  ==>  merged into ${formatTerm(newCoeff, prodExp)}`,
          ptrA, ptrB,
          active: after ? prodExp : null,
          flash: !!after
        });
      } else {
        recordStep(steps, result, {
          title: `Pair #${pairIndex}: New Term Inserted (${prodText})`,
          desc: `${pairText} = ${prodText}. No node with exponent ${prodExp} exists yet, so a new node is inserted in descending exponent order.`,
          math: `${pairText} = ${prodText}`,
          ptrA, ptrB, active: prodExp
        });
      }
      pairIndex++;
    }
  }

  recordStep(steps, result, {
    title: "Multiplication Complete ✓",
    desc: `All ${pairIndex - 1} term pairs were multiplied and merged into the sorted list. Final result: ${result.toString()}.`,
    math: `Result: ${result.toString()}`,
    done: true
  });

  return { result, steps };
}

/** DIFFERENTIATION: power rule applied node by node. */
function generateDifferentiationSteps(polyA) {
  const steps = [];
  const result = new Polynomial();

  recordStep(steps, result, {
    title: "Start Differentiation: d/dx A(x)",
    desc: `Differentiate A(x) = ${polyA.toString()} term by term with the power rule: d/dx (c · x^n) = (c · n) · x^(n−1).`,
    math: `d/dx (${polyA.toString()})`,
    ptrA: polyA.head
  });

  if (!polyA.head) {
    recordStep(steps, result, {
      title: "Derivative of Zero",
      desc: "Polynomial A is 0, and the derivative of 0 is 0.",
      math: "d/dx(0) = 0",
      done: true
    });
    return { result, steps };
  }

  for (let ptrA = polyA.head; ptrA !== null; ptrA = ptrA.next) {
    if (ptrA.exp > 0) {
      const newCoeff = cleanNumber(ptrA.coeff * ptrA.exp);
      const newExp = ptrA.exp - 1;
      result.insertTerm(newCoeff, newExp);
      recordStep(steps, result, {
        title: `Differentiate Term: ${formatTerm(ptrA.coeff, ptrA.exp)}`,
        desc: `Power rule on node [${ptrA.coeff} | exp ${ptrA.exp}]: (${ptrA.coeff} × ${ptrA.exp}) · x^(${ptrA.exp}−1) = ${formatTerm(newCoeff, newExp)}. Append it to the derivative list.`,
        math: `d/dx(${formatTerm(ptrA.coeff, ptrA.exp)}) = ${formatTerm(newCoeff, newExp)}`,
        ptrA, active: newCoeff !== 0 ? newExp : null
      });
    } else {
      recordStep(steps, result, {
        title: `Differentiate Constant: ${ptrA.coeff}`,
        desc: `Node [${ptrA.coeff} | exp 0] is a constant. The derivative of a constant is 0, so no node is added.`,
        math: `d/dx(${ptrA.coeff}) = 0`,
        ptrA, active: null
      });
    }
  }

  recordStep(steps, result, {
    title: "Differentiation Complete ✓",
    desc: `All terms differentiated. Final derivative: ${result.toString()}.`,
    math: `d/dx A(x) = ${result.toString()}`,
    done: true
  });

  return { result, steps };
}

/** EVALUATION: node-by-node accumulation of coeff * x^exp. */
function generateEvaluationSteps(polyA, x) {
  const steps = [];
  let runningTotal = 0;
  const totalSnap = () => [{ coeff: runningTotal, exp: 0 }];

  recordStep(steps, null, {
    title: `Start Evaluation at x = ${x}`,
    desc: `Walk the linked list of A node by node. For every node compute coeff × (${x})^exp and add it to the running total.`,
    math: `Evaluate A(${x}) for A(x) = ${polyA.toString()}`,
    ptrA: polyA.head,
    snapshot: []
  });

  if (!polyA.head) {
    recordStep(steps, null, {
      title: "Evaluate Zero Polynomial",
      desc: "Polynomial A is 0, so A(x) = 0 for every x.",
      math: `A(${x}) = 0`,
      snapshot: totalSnap(),
      done: true
    });
    return { total: 0, steps };
  }

  let nodeCount = 1;
  for (let ptrA = polyA.head; ptrA !== null; ptrA = ptrA.next) {
    const termVal = cleanNumber(ptrA.coeff * Math.pow(x, ptrA.exp));
    runningTotal = cleanNumber(runningTotal + termVal);
    recordStep(steps, null, {
      title: `Visit Node #${nodeCount}: [coeff ${ptrA.coeff} | exp ${ptrA.exp}]`,
      desc: `Term value: (${ptrA.coeff}) × (${x})^${ptrA.exp} = ${termVal}. Running total = ${runningTotal}. Advance ptr A.`,
      math: `(${ptrA.coeff}) × (${x})^${ptrA.exp} = ${termVal}   -->   Running Total = ${runningTotal}`,
      ptrA,
      snapshot: totalSnap()
    });
    nodeCount++;
  }

  recordStep(steps, null, {
    title: "Evaluation Complete ✓",
    desc: `All nodes visited. Final value: A(${x}) = ${runningTotal}.`,
    math: `A(${x}) = ${runningTotal}`,
    snapshot: totalSnap(),
    done: true
  });

  return { total: runningTotal, steps };
}

/* ============================================================================
 * 4. OPERATION INFO (shown in the "Theory & Viva Notes" panel)
 * ========================================================================== */

const OP_INFO = {
  add: {
    title: "Addition: A(x) + B(x)",
    complexity: "O(m + n) time · O(m + n) space  (m, n = nodes in A and B)",
    notes: [
      "Algorithm: two-pointer merge. ptr A and ptr B walk the two sorted lists together.",
      "Different exponents: the term with the larger exponent is appended to the result and only its pointer advances. Equal exponents: coefficients are added (a zero sum creates no node) and both pointers advance.",
      "When one list reaches NULL, the remaining nodes of the other list are copied to the result.",
      "Why linear: both lists are already sorted by descending exponent, so each node is visited exactly once."
    ]
  },
  subtract: {
    title: "Subtraction: A(x) − B(x)",
    complexity: "O(m + n) time · O(m + n) space  (m, n = nodes in A and B)",
    notes: [
      "Algorithm: the same two-pointer merge as addition, except every coefficient taken from B is negated.",
      "Equal exponents give c_A − c_B; if that is 0 the term disappears from the list.",
      "Leftover nodes of A are copied as they are; leftover nodes of B are copied with reversed sign.",
      "Why linear: each node of A and B is visited exactly once."
    ]
  },
  multiply: {
    title: "Multiplication: A(x) × B(x)",
    complexity: "O(m × n × r) time worst case · O(r) space  (r = nodes in the result, at most deg A + deg B + 1)",
    notes: [
      "Algorithm: for each node of A, walk every node of B; multiply the coefficients and add the exponents.",
      "Every product is inserted into the result in sorted position. If a node with that exponent already exists, the coefficients are merged; if the merged coefficient becomes 0 the node is unlinked.",
      "There are m × n products, and each insertion walks the result list (length r), which gives the O(m × n × r) bound.",
      "The result keeps the invariants: sorted by descending exponent, no zero coefficients, no duplicate exponents."
    ]
  },
  differentiate: {
    title: "Differentiation: d/dx A(x)",
    complexity: "O(n) time · O(n) space  (n = nodes in A)",
    notes: [
      "Algorithm: visit each node once and apply the power rule d/dx(c·x^n) = (c·n)·x^(n−1).",
      "The constant term (exponent 0) differentiates to 0, so it produces no node.",
      "Because exponents only drop by 1, the order stays descending and the result can be built in a single pass."
    ]
  },
  evaluate: {
    title: "Evaluation: A(x) at a given x",
    complexity: "O(n) node visits · O(1) extra space  (n = nodes in A)",
    notes: [
      "Algorithm: traverse the list from head to NULL; for each node add coeff × x^exp to a running total.",
      "Only non-zero terms are stored, so zero coefficients cost nothing.",
      "Each node is visited exactly once, so the traversal is linear in the number of stored terms."
    ]
  }
};

/* ============================================================================
 * 5. STATE & SMALL DOM HELPERS
 * ========================================================================== */

const $ = (id) => document.getElementById(id);

// Typed values survive degree changes
const storedCoeffsA = {};
const storedCoeffsB = {};

// Animation state
let recordedSteps = [];
let currentStepIndex = 0;
let playbackTimer = null;
let currentOpName = "add";
let currentPolyASnap = [];
let currentPolyBSnap = [];
let currentUsesB = false;
let currentFinalText = "";

const IDLE_RESULT_HTML = '<span class="empty">Choose an operation to see the result.</span>';

/* ============================================================================
 * 6. INPUT BUILDING & VALIDATION
 * ========================================================================== */

/** Builds degree + 1 coefficient boxes (x^degree ... x^0), keeping typed values. */
function buildCoeffInputs(polyKey, degree, initialValues = null) {
  const container = $(`coeffs${polyKey}`);
  const store = polyKey === "A" ? storedCoeffsA : storedCoeffsB;
  container.innerHTML = "";

  if (initialValues) {
    Object.keys(initialValues).forEach((exp) => {
      store[exp] = String(initialValues[exp]);
    });
  }

  for (let exp = degree; exp >= 0; exp--) {
    const item = document.createElement("div");
    item.className = "coeff-item";

    const label = document.createElement("label");
    label.className = "coeff-label";
    label.setAttribute("for", `coeff_${polyKey}_${exp}`);
    if (exp > 1) label.innerHTML = `x<sup>${exp}</sup>`;
    else if (exp === 1) label.textContent = "x";
    else label.innerHTML = "x<sup>0</sup> (const)";

    const input = document.createElement("input");
    input.type = "text";
    input.id = `coeff_${polyKey}_${exp}`;
    input.className = "coeff-input";
    input.dataset.poly = polyKey;
    input.dataset.exp = exp;
    input.placeholder = "0";
    input.autocomplete = "off";
    input.spellcheck = false;
    input.value = store[exp] !== undefined ? store[exp] : "";

    input.addEventListener("input", () => {
      store[exp] = input.value;
      // Old animation no longer matches the inputs -> start fresh
      if (recordedSteps.length > 0) resetToIdle();
      else updatePolyFromInputs(polyKey);
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") runOperation(currentOpName);
    });

    item.appendChild(label);
    item.appendChild(input);
    container.appendChild(item);
  }

  updatePolyFromInputs(polyKey);
}

/**
 * Reads the boxes of one polynomial, builds its linked list, updates the preview
 * and the static list view. Returns the Polynomial, or null if input is invalid.
 */
function updatePolyFromInputs(polyKey) {
  const errorEl = $(polyKey === "A" ? "aError" : "bError");
  const previewEl = $(polyKey === "A" ? "previewA" : "previewB");
  errorEl.textContent = "";

  const inputs = $(`coeffs${polyKey}`).querySelectorAll(".coeff-input");
  let isValid = true;
  const poly = new Polynomial();

  inputs.forEach((input) => {
    input.classList.remove("has-error");
    const rawVal = input.value.trim();
    const exp = parseInt(input.dataset.exp, 10);

    if (rawVal === "") return; // empty box = 0 -> no node

    const num = Number(rawVal);
    if (!Number.isFinite(num)) {
      input.classList.add("has-error");
      if (isValid) {
        errorEl.textContent = `Invalid number at x^${exp}: "${rawVal}". Enter a valid number (e.g. 3, -2.5).`;
      }
      isValid = false;
      return;
    }
    if (num !== 0) poly.insertTerm(num, exp);
  });

  if (!isValid) {
    previewEl.textContent = "(invalid input)";
    return null;
  }

  previewEl.textContent = poly.toString();
  const snap = getPolySnapshot(poly);
  if (polyKey === "A") renderList(snap, "pList", "pCount", { emptyText: "NULL (zero polynomial; 0 nodes)" });
  else renderList(snap, "qList", "qCount", { emptyText: "NULL (zero polynomial; 0 nodes)" });
  return poly;
}

function getValidatedPolynomials() {
  const polyA = updatePolyFromInputs("A");
  const polyB = updatePolyFromInputs("B");
  if (!polyA || !polyB) return null;
  return { polyA, polyB };
}

/* ============================================================================
 * 7. LINKED LIST RENDERING
 * ========================================================================== */

/**
 * Draws  [coeff | exp | next] -> ... -> NULL
 * opts: pointerExp, pointerClass, pointerLabel  (badge above the node)
 *       activeExp, activeClass, flashExp         (highlight)
 *       emptyText
 */
function renderList(snapshot, targetId, countId, opts = {}) {
  const target = $(targetId);
  const countEl = $(countId);
  countEl.textContent = `${snapshot.length} node${snapshot.length === 1 ? "" : "s"}`;

  if (snapshot.length === 0) {
    target.innerHTML = `<div class="empty-list">${escapeHtml(opts.emptyText || "NULL (empty list)")}</div>`;
    return;
  }

  target.innerHTML = "";
  const nodesRow = document.createElement("div");
  nodesRow.className = "nodes";

  snapshot.forEach((item) => {
    const nodeContainer = document.createElement("div");
    nodeContainer.className = "node-container";
    nodeContainer.dataset.exp = item.exp;

    // Slot above the node: keeps all nodes aligned, holds the pointer badge
    const slot = document.createElement("div");
    slot.className = "ptr-slot";
    slot.style.minHeight = "22px";
    if (opts.pointerExp !== undefined && opts.pointerExp !== null && opts.pointerExp === item.exp) {
      const badge = document.createElement("span");
      badge.className = `pointer-badge ${opts.pointerClass || ""}`;
      badge.textContent = `${opts.pointerLabel || "ptr"} ▼`;
      slot.appendChild(badge);
    }

    const box = document.createElement("div");
    box.className = "node";
    box.dataset.exp = item.exp;
    if (opts.activeExp !== undefined && opts.activeExp !== null && opts.activeExp === item.exp) {
      box.classList.add(opts.activeClass || "active-res");
    }
    if (opts.flashExp !== undefined && opts.flashExp !== null && opts.flashExp === item.exp) {
      box.classList.add("merge-flash");
    }
    box.innerHTML =
      `<div class="cell"><small>coeff</small>${escapeHtml(formatNumber(item.coeff))}</div>` +
      `<div class="cell"><small>exp</small>${item.exp}</div>` +
      `<div class="cell"><small>next</small>→</div>`;

    nodeContainer.appendChild(slot);
    nodeContainer.appendChild(box);
    nodesRow.appendChild(nodeContainer);

    const arrow = document.createElement("span");
    arrow.className = "arrow";
    arrow.textContent = "→";
    nodesRow.appendChild(arrow);
  });

  const nullBox = document.createElement("span");
  nullBox.className = "null";
  nullBox.textContent = "NULL";
  nodesRow.appendChild(nullBox);

  target.appendChild(nodesRow);
}

/** Shows "ptr X → NULL" above a list when that pointer is NULL; clears otherwise. */
function renderTrack(trackId, label, cls, show) {
  const track = $(trackId);
  track.innerHTML = "";
  if (!show) return;
  const badge = document.createElement("span");
  badge.className = `pointer-badge ${cls}`;
  badge.textContent = `${label} → NULL`;
  track.appendChild(badge);
}

/* ============================================================================
 * 8. ANIMATION ENGINE & CONTROLS
 * ========================================================================== */

function stopTimer() {
  if (playbackTimer !== null) {
    clearTimeout(playbackTimer);
    playbackTimer = null;
  }
}

function getDelay() {
  return Number($("speedSelect").value) || 900;
}

/** Loads a freshly generated step list into the UI (starts paused at step 1). */
function setupAnimation(steps, finalText, opTitle, complexity, notes) {
  stopTimer();
  recordedSteps = steps;
  currentStepIndex = 0;
  currentFinalText = finalText;

  renderStepLog(steps);

  $("operationLabel").textContent = opTitle;
  $("complexity").textContent = `Complexity: ${complexity}`;
  const explanation = $("explanation");
  explanation.className = "";
  explanation.innerHTML = notes
    .map((n) => `<p style="margin:0 0 8px">${escapeHtml(n)}</p>`)
    .join("");

  renderCurrentStep();
}

function updateControls() {
  const hasSteps = recordedSteps.length > 0;
  const last = recordedSteps.length - 1;
  const playing = playbackTimer !== null;

  $("btnPlayPause").textContent = playing
    ? "⏸ Pause"
    : hasSteps && currentStepIndex >= last
      ? "↻ Replay"
      : "▶ Play";
  $("btnPlayPause").disabled = !hasSteps;
  $("btnPrev").disabled = !hasSteps || currentStepIndex <= 0;
  $("btnNext").disabled = !hasSteps || currentStepIndex >= last;
  $("btnReset").disabled = !hasSteps || (currentStepIndex === 0 && !playing);
  $("btnSkip").disabled = !hasSteps || currentStepIndex >= last;

  const badge = $("animStatus");
  badge.classList.remove("running", "done");
  if (!hasSteps) {
    badge.textContent = "Ready";
  } else if (playing) {
    badge.textContent = "Playing";
    badge.classList.add("running");
  } else if (currentStepIndex >= last) {
    badge.textContent = "Done";
    badge.classList.add("done");
  } else {
    badge.textContent = currentStepIndex === 0 ? "Ready" : "Paused";
  }
}

/** Draws recordedSteps[currentStepIndex] everywhere. */
function renderCurrentStep() {
  if (!recordedSteps || recordedSteps.length === 0) {
    updateControls();
    return;
  }

  const total = recordedSteps.length;
  const step = recordedSteps[currentStepIndex];

  $("stepIndicator").textContent = `Step ${currentStepIndex + 1} of ${total}`;
  $("liveStepTitle").textContent = step.title;
  $("liveStepDesc").textContent = step.desc;
  $("liveMath").textContent = step.math;

  // List A
  renderList(currentPolyASnap, "pList", "pCount", {
    pointerExp: step.ptrAExp, pointerClass: "ptr-a", pointerLabel: "ptr A",
    activeExp: step.ptrAExp, activeClass: "active-a",
    emptyText: "NULL (zero polynomial; 0 nodes)"
  });
  renderTrack("trackA", "ptr A", "ptr-a", step.ptrAExp === null);

  // List B (only for operations that use it)
  if (currentUsesB) {
    renderList(currentPolyBSnap, "qList", "qCount", {
      pointerExp: step.ptrBExp, pointerClass: "ptr-b", pointerLabel: "ptr B",
      activeExp: step.ptrBExp, activeClass: "active-b",
      emptyText: "NULL (zero polynomial; 0 nodes)"
    });
    renderTrack("trackB", "ptr B", "ptr-b", step.ptrBExp === null);
  } else {
    renderList(currentPolyBSnap, "qList", "qCount", { emptyText: "NULL (zero polynomial; 0 nodes)" });
    renderTrack("trackB", "", "", false);
  }

  // Result list
  const isEval = currentOpName === "evaluate";
  renderList(step.resultSnapshot, "resList", "resCount", {
    pointerExp: isEval ? null : step.resultTailExp, pointerClass: "ptr-res", pointerLabel: "tail",
    activeExp: step.activeResultExp, activeClass: "active-res",
    flashExp: step.isMergeFlash ? step.activeResultExp : null,
    emptyText: "NULL (result list is empty)"
  });
  renderTrack("trackRes", "result tail", "ptr-res", !isEval && step.resultTailExp === null);

  // Result summary is revealed on the final step
  const resultEl = $("result");
  if (step.isFinished) {
    resultEl.textContent = currentFinalText;
  } else {
    resultEl.innerHTML = '<span class="empty">Computing… step through the animation to reveal the result.</span>';
  }
  $("status").textContent = step.isFinished
    ? "Operation complete."
    : `Step ${currentStepIndex + 1} of ${total}. Use Play, Next or Prev.`;

  highlightStepLog();
  updateControls();
}

function highlightStepLog() {
  const container = $("steps");
  const items = container.querySelectorAll(".step");
  items.forEach((el, i) => el.classList.toggle("active-step", i === currentStepIndex));

  const active = items[currentStepIndex];
  if (!active || !active.getBoundingClientRect) return;
  // Scroll only inside the log (does not move the page)
  const cr = container.getBoundingClientRect();
  const er = active.getBoundingClientRect();
  if (er.top < cr.top) container.scrollTop -= cr.top - er.top;
  else if (er.bottom > cr.bottom) container.scrollTop += er.bottom - cr.bottom;
}

function renderStepLog(steps) {
  const container = $("steps");
  container.innerHTML = "";
  steps.forEach((s, i) => {
    const el = document.createElement("div");
    el.className = "step";
    el.tabIndex = 0;
    el.setAttribute("role", "button");
    el.innerHTML = `<b>Step ${i + 1}:</b> ${escapeHtml(s.title)}<span class="math">${escapeHtml(s.math)}</span>`;
    const jump = () => {
      stopTimer();
      currentStepIndex = i;
      renderCurrentStep();
    };
    el.addEventListener("click", jump);
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        jump();
      }
    });
    container.appendChild(el);
  });
  $("stepCount").textContent = `${steps.length} step${steps.length === 1 ? "" : "s"}`;
}

function tick() {
  if (currentStepIndex < recordedSteps.length - 1) currentStepIndex++;
  if (currentStepIndex >= recordedSteps.length - 1) playbackTimer = null;
  else playbackTimer = setTimeout(tick, getDelay());
  renderCurrentStep();
}

function playAnimation() {
  if (recordedSteps.length === 0) return;
  stopTimer();
  if (currentStepIndex >= recordedSteps.length - 1) currentStepIndex = 0; // replay
  playbackTimer = setTimeout(tick, getDelay());
  renderCurrentStep();
}

function pauseAnimation() {
  stopTimer();
  renderCurrentStep();
}

function nextStep() {
  stopTimer();
  if (currentStepIndex < recordedSteps.length - 1) currentStepIndex++;
  renderCurrentStep();
}

function prevStep() {
  stopTimer();
  if (currentStepIndex > 0) currentStepIndex--;
  renderCurrentStep();
}

function resetAnimation() {
  stopTimer();
  currentStepIndex = 0;
  renderCurrentStep();
}

function skipToEnd() {
  stopTimer();
  if (recordedSteps.length > 0) currentStepIndex = recordedSteps.length - 1;
  renderCurrentStep();
}

/* ============================================================================
 * 9. RUNNING OPERATIONS
 * ========================================================================== */

function setActiveOpButton(op) {
  document.querySelectorAll("[data-op]").forEach((btn) => {
    btn.classList.toggle("primary", btn.dataset.op === op);
  });
}

function runOperation(op) {
  const polys = getValidatedPolynomials();
  if (!polys) {
    $("status").textContent = "Fix the highlighted coefficient boxes before running an operation.";
    return;
  }
  const { polyA, polyB } = polys;

  currentOpName = op;
  setActiveOpButton(op);
  $("evalRow").style.display = op === "evaluate" ? "block" : "none";

  let generated;
  let finalText;

  if (op === "evaluate") {
    const raw = $("xValue").value.trim();
    const x = Number(raw);
    if (raw === "" || !Number.isFinite(x)) {
      $("status").textContent = "Enter a valid number for x, then press Compute.";
      return;
    }
    generated = generateEvaluationSteps(polyA, x);
    finalText = `A(${x}) = ${formatNumber(generated.total)}`;
    currentUsesB = false;
  } else if (op === "add") {
    generated = generateMergeSteps(polyA, polyB, false);
    finalText = generated.result.toString();
    currentUsesB = true;
  } else if (op === "subtract") {
    generated = generateMergeSteps(polyA, polyB, true);
    finalText = generated.result.toString();
    currentUsesB = true;
  } else if (op === "multiply") {
    generated = generateMultiplicationSteps(polyA, polyB);
    finalText = generated.result.toString();
    currentUsesB = true;
  } else if (op === "differentiate") {
    generated = generateDifferentiationSteps(polyA);
    finalText = generated.result.toString();
    currentUsesB = false;
  } else {
    return;
  }

  currentPolyASnap = getPolySnapshot(polyA);
  currentPolyBSnap = getPolySnapshot(polyB);

  const info = OP_INFO[op];
  setupAnimation(generated.steps, finalText, info.title, info.complexity, info.notes);
}

/** Clears the animation and shows the idle state (inputs are kept). */
function resetToIdle() {
  stopTimer();
  recordedSteps = [];
  currentStepIndex = 0;
  currentFinalText = "";
  currentUsesB = false;

  $("stepIndicator").textContent = "Step 0 of 0";
  $("liveStepTitle").textContent = "No operation running";
  $("liveStepDesc").textContent = "Select an operation above to generate step-by-step linked list execution.";
  $("liveMath").textContent = "";

  updatePolyFromInputs("A");
  updatePolyFromInputs("B");
  renderTrack("trackA", "", "", false);
  renderTrack("trackB", "", "", false);
  renderTrack("trackRes", "", "", false);
  $("resList").innerHTML = '<div class="empty-list">Result list will appear here as steps execute.</div>';
  $("resCount").textContent = "0 nodes";

  $("operationLabel").textContent = "Ready";
  $("result").innerHTML = IDLE_RESULT_HTML;
  $("complexity").textContent = "Complexity: —";
  $("status").textContent = "Ready.";
  const explanation = $("explanation");
  explanation.className = "empty";
  explanation.textContent = "Operation details and viva explanation will appear here.";
  $("steps").innerHTML = '<div class="empty">Select an operation to generate the detailed step-by-step trace.</div>';
  $("stepCount").textContent = "0 steps";

  updateControls();
}

/* ============================================================================
 * 10. SAMPLES, CLEAR, INITIALISATION
 * ========================================================================== */

function clearStore(store) {
  Object.keys(store).forEach((k) => delete store[k]);
}

function loadSamples() {
  // A = 4x^4 + 3x^3 - 2x + 5   |   B = -4x^4 + 2x^3 + x^2 - 2x + 3
  // Shows: a zero coefficient (omitted), cancellation in A+B (x^4) and in A-B (x).
  clearStore(storedCoeffsA);
  clearStore(storedCoeffsB);
  $("degreeA").value = "4";
  $("degreeB").value = "4";
  buildCoeffInputs("A", 4, { 4: "4", 3: "3", 2: "0", 1: "-2", 0: "5" });
  buildCoeffInputs("B", 4, { 4: "-4", 3: "2", 2: "1", 1: "-2", 0: "3" });
  resetToIdle();
}

function clearAll() {
  clearStore(storedCoeffsA);
  clearStore(storedCoeffsB);
  buildCoeffInputs("A", Number($("degreeA").value));
  buildCoeffInputs("B", Number($("degreeB").value));
  $("evalRow").style.display = "none";
  resetToIdle();
}

function init() {
  // Default polynomials: A = 3x^2 + 2x + 1, B = x^2 - 2x + 4
  $("degreeA").value = "2";
  $("degreeB").value = "2";
  buildCoeffInputs("A", 2, { 2: "3", 1: "2", 0: "1" });
  buildCoeffInputs("B", 2, { 2: "1", 1: "-2", 0: "4" });

  $("degreeA").addEventListener("change", () => {
    buildCoeffInputs("A", Number($("degreeA").value));
    if (recordedSteps.length > 0) resetToIdle();
  });
  $("degreeB").addEventListener("change", () => {
    buildCoeffInputs("B", Number($("degreeB").value));
    if (recordedSteps.length > 0) resetToIdle();
  });

  document.querySelectorAll("[data-op]").forEach((btn) => {
    btn.addEventListener("click", () => runOperation(btn.dataset.op));
  });
  $("btnRunEval").addEventListener("click", () => runOperation("evaluate"));
  $("xValue").addEventListener("keydown", (e) => {
    if (e.key === "Enter") runOperation("evaluate");
  });

  $("sampleBtn").addEventListener("click", loadSamples);
  $("clearBtn").addEventListener("click", clearAll);

  $("btnPlayPause").addEventListener("click", () => {
    if (playbackTimer !== null) pauseAnimation();
    else playAnimation();
  });
  $("btnPrev").addEventListener("click", prevStep);
  $("btnNext").addEventListener("click", nextStep);
  $("btnReset").addEventListener("click", resetAnimation);
  $("btnSkip").addEventListener("click", skipToEnd);
  $("speedSelect").addEventListener("change", () => {
    if (playbackTimer !== null) {
      stopTimer();
      playbackTimer = setTimeout(tick, getDelay());
    }
  });

  resetToIdle();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
