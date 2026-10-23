"use strict";

/**
 * ============================================================================
 * DATA STRUCTURES MINI PROJECT: POLYNOMIAL CALCULATOR USING SINGLY LINKED LIST
 * ============================================================================
 * Student: Ankur Patil
 *
 * Core Concept:
 * A polynomial is an expression consisting of variables and coefficients.
 * Here, every non-zero term (coeff * x^exp) is stored as an individual Node
 * in a genuine Singly Linked List.
 *
 * Linked List Invariants:
 * 1. Strictly sorted in descending order of exponents:
 *    head -> [c_1 | e_1 | next] -> [c_2 | e_2 | next] -> ... -> NULL, where e_1 > e_2.
 * 2. Terms with a coefficient of zero are NEVER stored.
 * 3. Like terms (terms with the same exponent) are merged during insertion.
 * 4. All mathematical operations (Add, Subtract, Multiply, Differentiate, Evaluate)
 *    are performed directly using pointer manipulations on the linked list.
 * ============================================================================
 */

/**
 * Node Class
 * Represents a single term in the polynomial: coeff * x^exp.
 */
class Node {
  constructor(coeff, exp) {
    this.coeff = cleanNumber(coeff); // Clean tiny floating point inaccuracies
    this.exp = exp;                  // Integer power of x
    this.next = null;                // Pointer to the next term in descending order
  }
}

/**
 * Polynomial Class (Singly Linked List)
 * Manages polynomial terms strictly using node pointers.
 */
class Polynomial {
  constructor() {
    this.head = null; // Pointer to the highest degree term
  }

  /**
   * insertTerm(coeff, exp):
   * Inserts a term into the singly linked list while maintaining descending exponent order.
   * If a node with the same exponent already exists:
   *   - Combines their coefficients.
   *   - If the combined coefficient becomes 0, removes that node.
   * If coeff is 0, no node is created.
   */
  insertTerm(coeff, exp) {
    coeff = cleanNumber(coeff);
    if (!Number.isFinite(coeff) || !Number.isInteger(exp)) {
      throw new Error("Invalid term: Coefficient must be finite and exponent must be an integer.");
    }
    // Rule: Zero coefficients must not create nodes in the linked list
    if (coeff === 0) return;

    let prev = null;
    let curr = this.head;

    // Traverse until finding the insertion point (descending order of exp)
    while (curr !== null && curr.exp > exp) {
      prev = curr;
      curr = curr.next;
    }

    // Case 1: Exponent already exists -> combine like terms
    if (curr !== null && curr.exp === exp) {
      curr.coeff = cleanNumber(curr.coeff + coeff);
      // If the merged coefficient becomes zero, unlink and remove the node
      if (curr.coeff === 0) {
        if (prev === null) {
          this.head = curr.next;
        } else {
          prev.next = curr.next;
        }
      }
      return;
    }

    // Case 2: Exponent does not exist -> allocate new node and insert
    const newNode = new Node(coeff, exp);
    newNode.next = curr;
    if (prev === null) {
      this.head = newNode;
    } else {
      prev.next = newNode;
    }
  }

  /**
   * traverse(callback):
   * Traversal method visiting every node from head to tail.
   */
  traverse(callback) {
    let curr = this.head;
    let index = 0;
    while (curr !== null) {
      callback(curr, index++);
      curr = curr.next;
    }
  }

  /**
   * clone():
   * Returns a deep copy of the polynomial linked list.
   */
  clone() {
    const copy = new Polynomial();
    let curr = this.head;
    while (curr !== null) {
      copy.insertTerm(curr.coeff, curr.exp);
      curr = curr.next;
    }
    return copy;
  }

  /**
   * get length():
   * Returns total node count in the linked list by traversing pointers.
   */
  get length() {
    let count = 0;
    let curr = this.head;
    while (curr !== null) {
      count++;
      curr = curr.next;
    }
    return count;
  }

  /**
   * toString():
   * Formats the polynomial into standard clean mathematical notation.
   * Formatting Rules:
   *  - Empty list -> "0"
   *  - Negative terms use " - " instead of "+ -"
   *  - Coefficients of 1 or -1 omit the 1 (e.g., "x^2", "-x", not "1x^2")
   *  - Exponent of 1 written as "x" (not "x^1")
   *  - Exponent of 0 written as constant number only
   */
  toString() {
    if (!this.head) return "0";
    let str = "";
    let curr = this.head;

    while (curr !== null) {
      const coeff = cleanNumber(curr.coeff);
      const absCoeff = Math.abs(coeff);
      const exp = curr.exp;

      // Variable part formatting
      let varStr = "";
      if (exp > 1) {
        varStr = `x^${exp}`;
      } else if (exp === 1) {
        varStr = "x";
      }

      // Coefficient part formatting
      let coeffStr = "";
      if (exp === 0) {
        coeffStr = formatNumber(absCoeff);
      } else {
        if (Math.abs(absCoeff - 1) < 1e-10) {
          coeffStr = "";
        } else {
          coeffStr = formatNumber(absCoeff);
        }
      }

      const term = coeffStr + varStr;

      if (str === "") {
        // First / leading term
        str = (coeff < 0 ? "-" : "") + term;
      } else {
        // Subsequent terms with proper spacing
        str += (coeff < 0 ? " - " : " + ") + term;
      }

      curr = curr.next;
    }

    return str || "0";
  }

  /**
   * evaluate(x):
   * Traverses node-by-node, evaluating coeff * (x ^ exp) at a given x.
   */
  evaluate(x) {
    let total = 0;
    let curr = this.head;
    while (curr !== null) {
      total += curr.coeff * Math.pow(x, curr.exp);
      curr = curr.next;
    }
    return cleanNumber(total);
  }

  /**
   * differentiate():
   * Computes derivative d/dx using power rule: d/dx(c * x^n) = (c * n) * x^(n - 1).
   * Constant terms (exp 0) differentiate to 0 and are omitted.
   */
  differentiate() {
    const deriv = new Polynomial();
    let curr = this.head;
    while (curr !== null) {
      if (curr.exp > 0) {
        deriv.insertTerm(curr.coeff * curr.exp, curr.exp - 1);
      }
      curr = curr.next;
    }
    return deriv;
  }
}

/**
 * ============================================================================
 * HELPER UTILITIES: NUMBER FORMATTING & TERM STRINGS
 * ============================================================================
 */
function cleanNumber(n) {
  if (typeof n !== "number" || !Number.isFinite(n)) return 0;
  return Math.abs(n) < 1e-10 ? 0 : Number(n.toFixed(8)) / 1;
}

function formatNumber(n) {
  n = cleanNumber(n);
  if (Number.isInteger(n)) return String(n);
  return Number(n.toPrecision(7)).toString();
}

/** Format a single term for descriptions and math badges */
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

/** Takes a snapshot array of nodes for recorded playback */
function getPolySnapshot(poly) {
  const snapshot = [];
  let curr = poly.head;
  while (curr !== null) {
    snapshot.push({ coeff: curr.coeff, exp: curr.exp });
    curr = curr.next;
  }
  return snapshot;
}

/** Returns the exponent of the last node in the linked list (tail) */
function getLastExp(poly) {
  if (!poly || !poly.head) return null;
  let curr = poly.head;
  while (curr.next !== null) {
    curr = curr.next;
  }
  return curr.exp;
}

/**
 * ============================================================================
 * STEP GENERATORS: RECORDED STATE LISTS FOR ANIMATION ENGINE
 * ============================================================================
 * Every operation pre-records an array of state snapshots.
 * This guarantees that Next step, Prev step, Pause, Reset, and Skip
 * operate with 100% mathematical fidelity.
 */

/** ADDITION: Two-Pointer Merge of Sorted Singly Linked Lists */
function generateAdditionSteps(polyA, polyB) {
  const steps = [];
  const result = new Polynomial();

  steps.push({
    title: "Start Addition (Two-Pointer Merge Algorithm)",
    desc: "Initialize pointers: ptr A points to the head of Polynomial A, ptr B points to the head of Polynomial B. Result list starts empty.",
    math: `A(x) = ${polyA.toString()}   |   B(x) = ${polyB.toString()}`,
    ptrAExp: polyA.head ? polyA.head.exp : null,
    ptrBExp: polyB.head ? polyB.head.exp : null,
    resultTailExp: null,
    activeResultExp: null,
    isMergeFlash: false,
    resultSnapshot: getPolySnapshot(result),
    isFinished: false
  });

  let ptrA = polyA.head;
  let ptrB = polyB.head;

  while (ptrA !== null || ptrB !== null) {
    if (ptrA !== null && ptrB !== null) {
      if (ptrA.exp > ptrB.exp) {
        // ptrA has greater exponent -> copy term A
        result.insertTerm(ptrA.coeff, ptrA.exp);
        steps.push({
          title: `Compare Exponents: exp ${ptrA.exp} > exp ${ptrB.exp}`,
          desc: `ptr A has a higher power (${ptrA.exp} > ${ptrB.exp}). Copy term ${formatTerm(ptrA.coeff, ptrA.exp)} from Poly A into the result list, then advance ptr A.`,
          math: `Copy ${formatTerm(ptrA.coeff, ptrA.exp)} to result`,
          ptrAExp: ptrA.exp,
          ptrBExp: ptrB.exp,
          resultTailExp: ptrA.exp,
          activeResultExp: ptrA.exp,
          isMergeFlash: false,
          resultSnapshot: getPolySnapshot(result),
          isFinished: false
        });
        ptrA = ptrA.next;
      } else if (ptrB.exp > ptrA.exp) {
        // ptrB has greater exponent -> copy term B
        result.insertTerm(ptrB.coeff, ptrB.exp);
        steps.push({
          title: `Compare Exponents: exp ${ptrB.exp} > exp ${ptrA.exp}`,
          desc: `ptr B has a higher power (${ptrB.exp} > ${ptrA.exp}). Copy term ${formatTerm(ptrB.coeff, ptrB.exp)} from Poly B into the result list, then advance ptr B.`,
          math: `Copy ${formatTerm(ptrB.coeff, ptrB.exp)} to result`,
          ptrAExp: ptrA.exp,
          ptrBExp: ptrB.exp,
          resultTailExp: ptrB.exp,
          activeResultExp: ptrB.exp,
          isMergeFlash: false,
          resultSnapshot: getPolySnapshot(result),
          isFinished: false
        });
        ptrB = ptrB.next;
      } else {
        // Equal exponents -> add coefficients
        const sumCoeff = cleanNumber(ptrA.coeff + ptrB.coeff);
        const exp = ptrA.exp;
        if (sumCoeff !== 0) {
          result.insertTerm(sumCoeff, exp);
          steps.push({
            title: `Equal Exponents: exp ${exp} == exp ${exp}`,
            desc: `Both pointers point to exponent ${exp}. Add coefficients: (${ptrA.coeff}) + (${ptrB.coeff}) = ${sumCoeff}. Insert new combined term ${formatTerm(sumCoeff, exp)} into result. Advance both ptr A and ptr B.`,
            math: `(${formatTerm(ptrA.coeff, exp)}) + (${formatTerm(ptrB.coeff, exp)}) = ${formatTerm(sumCoeff, exp)}`,
            ptrAExp: ptrA.exp,
            ptrBExp: ptrB.exp,
            resultTailExp: exp,
            activeResultExp: exp,
            isMergeFlash: false,
            resultSnapshot: getPolySnapshot(result),
            isFinished: false
          });
        } else {
          steps.push({
            title: `Equal Exponents Cancel Out: exp ${exp}`,
            desc: `Both nodes have exponent ${exp}. Coefficients cancel out: (${ptrA.coeff}) + (${ptrB.coeff}) = 0. In our linked list, zero-coefficient terms are not stored. Advance both ptr A and ptr B.`,
            math: `(${formatTerm(ptrA.coeff, exp)}) + (${formatTerm(ptrB.coeff, exp)}) = 0 (Node omitted)`,
            ptrAExp: ptrA.exp,
            ptrBExp: ptrB.exp,
            resultTailExp: getLastExp(result),
            activeResultExp: null,
            isMergeFlash: false,
            resultSnapshot: getPolySnapshot(result),
            isFinished: false
          });
        }
        ptrA = ptrA.next;
        ptrB = ptrB.next;
      }
    } else if (ptrA !== null) {
      // Poly B reached null -> copy remaining nodes from A
      result.insertTerm(ptrA.coeff, ptrA.exp);
      steps.push({
        title: `Poly B Exhausted (NULL)`,
        desc: `ptr B is NULL. Copy remaining term ${formatTerm(ptrA.coeff, ptrA.exp)} from Poly A into result and advance ptr A.`,
        math: `Append ${formatTerm(ptrA.coeff, ptrA.exp)} to result`,
        ptrAExp: ptrA.exp,
        ptrBExp: null,
        resultTailExp: ptrA.exp,
        activeResultExp: ptrA.exp,
        isMergeFlash: false,
        resultSnapshot: getPolySnapshot(result),
        isFinished: false
      });
      ptrA = ptrA.next;
    } else {
      // Poly A reached null -> copy remaining nodes from B
      result.insertTerm(ptrB.coeff, ptrB.exp);
      steps.push({
        title: `Poly A Exhausted (NULL)`,
        desc: `ptr A is NULL. Copy remaining term ${formatTerm(ptrB.coeff, ptrB.exp)} from Poly B into result and advance ptr B.`,
        math: `Append ${formatTerm(ptrB.coeff, ptrB.exp)} to result`,
        ptrAExp: null,
        ptrBExp: ptrB.exp,
        resultTailExp: ptrB.exp,
        activeResultExp: ptrB.exp,
        isMergeFlash: false,
        resultSnapshot: getPolySnapshot(result),
        isFinished: false
      });
      ptrB = ptrB.next;
    }
  }

  // Final step
  steps.push({
    title: "Addition Complete ✓",
    desc: `Both pointers have reached NULL. The sorted linked lists were merged in O(m+n) time. Final result polynomial: ${result.toString()}.`,
    math: `Result: ${result.toString()}`,
    ptrAExp: null,
    ptrBExp: null,
    resultTailExp: getLastExp(result),
    activeResultExp: null,
    isMergeFlash: false,
    resultSnapshot: getPolySnapshot(result),
    isFinished: true
  });

  return { result, steps };
}

/** SUBTRACTION: Two-Pointer Merge with Negated Coefficients */
function generateSubtractionSteps(polyA, polyB) {
  const steps = [];
  const result = new Polynomial();

  steps.push({
    title: "Start Subtraction: A(x) − B(x)",
    desc: "Subtract Polynomial B from Polynomial A. Pointers ptr A and ptr B start at the heads. For terms in B, reverse their sign: c_A − c_B.",
    math: `A(x) = ${polyA.toString()}   |   B(x) = ${polyB.toString()}`,
    ptrAExp: polyA.head ? polyA.head.exp : null,
    ptrBExp: polyB.head ? polyB.head.exp : null,
    resultTailExp: null,
    activeResultExp: null,
    isMergeFlash: false,
    resultSnapshot: getPolySnapshot(result),
    isFinished: false
  });

  let ptrA = polyA.head;
  let ptrB = polyB.head;

  while (ptrA !== null || ptrB !== null) {
    if (ptrA !== null && ptrB !== null) {
      if (ptrA.exp > ptrB.exp) {
        result.insertTerm(ptrA.coeff, ptrA.exp);
        steps.push({
          title: `Compare Exponents: exp ${ptrA.exp} > exp ${ptrB.exp}`,
          desc: `ptr A has a higher power (${ptrA.exp} > ${ptrB.exp}). Copy term ${formatTerm(ptrA.coeff, ptrA.exp)} from A into result and advance ptr A.`,
          math: `Copy ${formatTerm(ptrA.coeff, ptrA.exp)} to result`,
          ptrAExp: ptrA.exp,
          ptrBExp: ptrB.exp,
          resultTailExp: ptrA.exp,
          activeResultExp: ptrA.exp,
          isMergeFlash: false,
          resultSnapshot: getPolySnapshot(result),
          isFinished: false
        });
        ptrA = ptrA.next;
      } else if (ptrB.exp > ptrA.exp) {
        const negCoeff = cleanNumber(-ptrB.coeff);
        result.insertTerm(negCoeff, ptrB.exp);
        steps.push({
          title: `Compare Exponents: exp ${ptrB.exp} > exp ${ptrA.exp}`,
          desc: `ptr B has a higher power (${ptrB.exp} > ${ptrA.exp}). Negate B's coefficient and append ${formatTerm(negCoeff, ptrB.exp)} to result. Advance ptr B.`,
          math: `Append −(${formatTerm(ptrB.coeff, ptrB.exp)}) = ${formatTerm(negCoeff, ptrB.exp)} to result`,
          ptrAExp: ptrA.exp,
          ptrBExp: ptrB.exp,
          resultTailExp: ptrB.exp,
          activeResultExp: ptrB.exp,
          isMergeFlash: false,
          resultSnapshot: getPolySnapshot(result),
          isFinished: false
        });
        ptrB = ptrB.next;
      } else {
        const diffCoeff = cleanNumber(ptrA.coeff - ptrB.coeff);
        const exp = ptrA.exp;
        if (diffCoeff !== 0) {
          result.insertTerm(diffCoeff, exp);
          steps.push({
            title: `Equal Exponents: exp ${exp} == exp ${exp}`,
            desc: `Both pointers point to exponent ${exp}. Subtract coefficients: (${ptrA.coeff}) − (${ptrB.coeff}) = ${diffCoeff}. Insert ${formatTerm(diffCoeff, exp)} into result. Advance both pointers.`,
            math: `(${formatTerm(ptrA.coeff, exp)}) − (${formatTerm(ptrB.coeff, exp)}) = ${formatTerm(diffCoeff, exp)}`,
            ptrAExp: ptrA.exp,
            ptrBExp: ptrB.exp,
            resultTailExp: exp,
            activeResultExp: exp,
            isMergeFlash: false,
            resultSnapshot: getPolySnapshot(result),
            isFinished: false
          });
        } else {
          steps.push({
            title: `Equal Exponents Cancel Out: exp ${exp}`,
            desc: `Both terms have exponent ${exp}. Difference cancels to 0: (${ptrA.coeff}) − (${ptrB.coeff}) = 0. Zero terms are omitted from the linked list. Advance both pointers.`,
            math: `(${formatTerm(ptrA.coeff, exp)}) − (${formatTerm(ptrB.coeff, exp)}) = 0 (Node omitted)`,
            ptrAExp: ptrA.exp,
            ptrBExp: ptrB.exp,
            resultTailExp: getLastExp(result),
            activeResultExp: null,
            isMergeFlash: false,
            resultSnapshot: getPolySnapshot(result),
            isFinished: false
          });
        }
        ptrA = ptrA.next;
        ptrB = ptrB.next;
      }
    } else if (ptrA !== null) {
      result.insertTerm(ptrA.coeff, ptrA.exp);
      steps.push({
        title: `Poly B Exhausted (NULL)`,
        desc: `ptr B is NULL. Copy remaining term ${formatTerm(ptrA.coeff, ptrA.exp)} from Poly A into result. Advance ptr A.`,
        math: `Append ${formatTerm(ptrA.coeff, ptrA.exp)} to result`,
        ptrAExp: ptrA.exp,
        ptrBExp: null,
        resultTailExp: ptrA.exp,
        activeResultExp: ptrA.exp,
        isMergeFlash: false,
        resultSnapshot: getPolySnapshot(result),
        isFinished: false
      });
      ptrA = ptrA.next;
    } else {
      const negCoeff = cleanNumber(-ptrB.coeff);
      result.insertTerm(negCoeff, ptrB.exp);
      steps.push({
        title: `Poly A Exhausted (NULL)`,
        desc: `ptr A is NULL. Negate remaining term from Poly B and append ${formatTerm(negCoeff, ptrB.exp)} to result. Advance ptr B.`,
        math: `Append −(${formatTerm(ptrB.coeff, ptrB.exp)}) = ${formatTerm(negCoeff, ptrB.exp)} to result`,
        ptrAExp: null,
        ptrBExp: ptrB.exp,
        resultTailExp: ptrB.exp,
        activeResultExp: ptrB.exp,
        isMergeFlash: false,
        resultSnapshot: getPolySnapshot(result),
        isFinished: false
      });
      ptrB = ptrB.next;
    }
  }

  steps.push({
    title: "Subtraction Complete ✓",
    desc: `Both pointers reached NULL. Final result polynomial: ${result.toString()}.`,
    math: `Result: ${result.toString()}`,
    ptrAExp: null,
    ptrBExp: null,
    resultTailExp: getLastExp(result),
    activeResultExp: null,
    isMergeFlash: false,
    resultSnapshot: getPolySnapshot(result),
    isFinished: true
  });

  return { result, steps };
}

/** MULTIPLICATION: Term-by-Term Multiplication & Like-Term Merging */
function generateMultiplicationSteps(polyA, polyB) {
  const steps = [];
  const result = new Polynomial();

  steps.push({
    title: "Start Multiplication: A(x) × B(x)",
    desc: "Iterate through every term of Polynomial A, and multiply it by every term of Polynomial B using rule: (a·x^m)(b·x^n) = (a·b)·x^(m+n). Like powers are combined in the result list.",
    math: `A(x) = ${polyA.toString()}   |   B(x) = ${polyB.toString()}`,
    ptrAExp: polyA.head ? polyA.head.exp : null,
    ptrBExp: polyB.head ? polyB.head.exp : null,
    resultTailExp: null,
    activeResultExp: null,
    isMergeFlash: false,
    resultSnapshot: getPolySnapshot(result),
    isFinished: false
  });

  if (!polyA.head || !polyB.head) {
    steps.push({
      title: "Zero Polynomial Product",
      desc: "One of the polynomials has no non-zero terms (evaluates to 0). The product with 0 is 0.",
      math: "Result = 0",
      ptrAExp: null,
      ptrBExp: null,
      resultTailExp: null,
      activeResultExp: null,
      isMergeFlash: false,
      resultSnapshot: [],
      isFinished: true
    });
    return { result, steps };
  }

  let ptrA = polyA.head;
  let pairIndex = 1;

  while (ptrA !== null) {
    let ptrB = polyB.head;
    while (ptrB !== null) {
      const prodCoeff = cleanNumber(ptrA.coeff * ptrB.coeff);
      const prodExp = ptrA.exp + ptrB.exp;

      // Check whether a node with this exponent already exists in the result list
      let existingNode = null;
      let curr = result.head;
      while (curr !== null) {
        if (curr.exp === prodExp) {
          existingNode = curr;
          break;
        }
        curr = curr.next;
      }

      if (existingNode) {
        const oldCoeff = existingNode.coeff;
        result.insertTerm(prodCoeff, prodExp);
        const newCoeff = existingNode.coeff;
        steps.push({
          title: `Pair #${pairIndex}: Like Power Merged (x^${prodExp})`,
          desc: `Multiply (${formatTerm(ptrA.coeff, ptrA.exp)}) × (${formatTerm(ptrB.coeff, ptrB.exp)}) = ${formatTerm(prodCoeff, prodExp)}. A node with exponent ${prodExp} already exists in result (${formatTerm(oldCoeff, prodExp)}). Merged: (${oldCoeff}) + (${prodCoeff}) = ${newCoeff}.`,
          math: `(${formatTerm(ptrA.coeff, ptrA.exp)}) × (${formatTerm(ptrB.coeff, ptrB.exp)})  ==>  Merge into ${formatTerm(newCoeff, prodExp)}`,
          ptrAExp: ptrA.exp,
          ptrBExp: ptrB.exp,
          resultTailExp: getLastExp(result),
          activeResultExp: prodExp,
          isMergeFlash: true, // Triggers flash animation on the merged node
          resultSnapshot: getPolySnapshot(result),
          isFinished: false
        });
      } else {
        result.insertTerm(prodCoeff, prodExp);
        steps.push({
          title: `Pair #${pairIndex}: New Term Inserted (${formatTerm(prodCoeff, prodExp)})`,
          desc: `Multiply (${formatTerm(ptrA.coeff, ptrA.exp)}) × (${formatTerm(ptrB.coeff, ptrB.exp)}) = ${formatTerm(prodCoeff, prodExp)}. Inserted in descending exponent order into result linked list.`,
          math: `(${formatTerm(ptrA.coeff, ptrA.exp)}) × (${formatTerm(ptrB.coeff, ptrB.exp)}) = ${formatTerm(prodCoeff, prodExp)}`,
          ptrAExp: ptrA.exp,
          ptrBExp: ptrB.exp,
          resultTailExp: getLastExp(result),
          activeResultExp: prodExp,
          isMergeFlash: false,
          resultSnapshot: getPolySnapshot(result),
          isFinished: false
        });
      }

      ptrB = ptrB.next;
      pairIndex++;
    }
    ptrA = ptrA.next;
  }

  steps.push({
    title: "Multiplication Complete ✓",
    desc: `All ${pairIndex - 1} term pairs computed and merged into the sorted linked list. Final result: ${result.toString()}.`,
    math: `Result: ${result.toString()}`,
    ptrAExp: null,
    ptrBExp: null,
    resultTailExp: getLastExp(result),
    activeResultExp: null,
    isMergeFlash: false,
    resultSnapshot: getPolySnapshot(result),
    isFinished: true
  });

  return { result, steps };
}

/** DIFFERENTIATION: Node-by-Node Power Rule */
function generateDifferentiationSteps(polyA) {
  const steps = [];
  const result = new Polynomial();

  steps.push({
    title: "Start Differentiation: d/dx A(x)",
    desc: `Differentiating polynomial A(x) = ${polyA.toString()} term-by-term using power rule: d/dx (c · x^n) = (c · n) · x^(n - 1).`,
    math: `d/dx (${polyA.toString()})`,
    ptrAExp: polyA.head ? polyA.head.exp : null,
    ptrBExp: null,
    resultTailExp: null,
    activeResultExp: null,
    isMergeFlash: false,
    resultSnapshot: getPolySnapshot(result),
    isFinished: false
  });

  if (!polyA.head) {
    steps.push({
      title: "Derivative of Zero",
      desc: "Polynomial A is 0. The derivative of 0 is 0.",
      math: "d/dx(0) = 0",
      ptrAExp: null,
      ptrBExp: null,
      resultTailExp: null,
      activeResultExp: null,
      isMergeFlash: false,
      resultSnapshot: [],
      isFinished: true
    });
    return { result, steps };
  }

  let ptrA = polyA.head;
  while (ptrA !== null) {
    if (ptrA.exp > 0) {
      const newCoeff = cleanNumber(ptrA.coeff * ptrA.exp);
      const newExp = ptrA.exp - 1;
      result.insertTerm(newCoeff, newExp);
      steps.push({
        title: `Differentiate Term: ${formatTerm(ptrA.coeff, ptrA.exp)}`,
        desc: `Power rule on node [${ptrA.coeff} | exp ${ptrA.exp}]: d/dx(${ptrA.coeff} · x^${ptrA.exp}) = (${ptrA.coeff} × ${ptrA.exp}) · x^(${ptrA.exp}-1) = ${formatTerm(newCoeff, newExp)}. Add to derivative list.`,
        math: `d/dx(${formatTerm(ptrA.coeff, ptrA.exp)}) = ${formatTerm(newCoeff, newExp)}`,
        ptrAExp: ptrA.exp,
        ptrBExp: null,
        resultTailExp: newExp,
        activeResultExp: newExp,
        isMergeFlash: false,
        resultSnapshot: getPolySnapshot(result),
        isFinished: false
      });
    } else {
      steps.push({
        title: `Differentiate Constant: ${ptrA.coeff}`,
        desc: `Node [${ptrA.coeff} | exp 0] is a constant term. The derivative of a constant is 0. No node added to linked list.`,
        math: `d/dx(${ptrA.coeff}) = 0`,
        ptrAExp: 0,
        ptrBExp: null,
        resultTailExp: getLastExp(result),
        activeResultExp: null,
        isMergeFlash: false,
        resultSnapshot: getPolySnapshot(result),
        isFinished: false
      });
    }
    ptrA = ptrA.next;
  }

  steps.push({
    title: "Differentiation Complete ✓",
    desc: `All terms differentiated. Final derivative polynomial: ${result.toString()}.`,
    math: `d/dx A(x) = ${result.toString()}`,
    ptrAExp: null,
    ptrBExp: null,
    resultTailExp: getLastExp(result),
    activeResultExp: null,
    isMergeFlash: false,
    resultSnapshot: getPolySnapshot(result),
    isFinished: true
  });

  return { result, steps };
}

/** EVALUATION: Node-by-Node Accumulation at x = c */
function generateEvaluationSteps(polyA, x) {
  const steps = [];
  let runningTotal = 0;

  steps.push({
    title: `Start Evaluation at x = ${x}`,
    desc: `Traverse singly linked list of Poly A node-by-node. For each node, compute coeff × (${x})^exp and add to the running total.`,
    math: `Evaluate A(${x}) for A(x) = ${polyA.toString()}`,
    ptrAExp: polyA.head ? polyA.head.exp : null,
    ptrBExp: null,
    resultTailExp: null,
    activeResultExp: null,
    isMergeFlash: false,
    resultSnapshot: [],
    isFinished: false
  });

  if (!polyA.head) {
    steps.push({
      title: "Evaluate Zero Polynomial",
      desc: "Polynomial A is 0. A(x) = 0 for any x.",
      math: `A(${x}) = 0`,
      ptrAExp: null,
      ptrBExp: null,
      resultTailExp: null,
      activeResultExp: null,
      isMergeFlash: false,
      resultSnapshot: [{ coeff: 0, exp: 0 }],
      isFinished: true
    });
    return { total: 0, steps };
  }

  let ptrA = polyA.head;
  let nodeCount = 1;

  while (ptrA !== null) {
    const termVal = cleanNumber(ptrA.coeff * Math.pow(x, ptrA.exp));
    runningTotal = cleanNumber(runningTotal + termVal);
    steps.push({
      title: `Visit Node #${nodeCount}: [coeff ${ptrA.coeff} | exp ${ptrA.exp}]`,
      desc: `Compute term value: (${ptrA.coeff}) × (${x})^${ptrA.exp} = ${termVal}. Running sum = ${runningTotal}. Advance ptr A.`,
      math: `(${ptrA.coeff}) × (${x})^${ptrA.exp} = ${termVal}   -->   Running Total = ${runningTotal}`,
      ptrAExp: ptrA.exp,
      ptrBExp: null,
      resultTailExp: null,
      activeResultExp: null,
      isMergeFlash: false,
      resultSnapshot: [{ coeff: runningTotal, exp: 0 }],
      isFinished: false
    });
    ptrA = ptrA.next;
    nodeCount++;
  }

  steps.push({
    title: "Evaluation Complete ✓",
    desc: `All nodes evaluated. Final value of A(${x}) = ${runningTotal}.`,
    math: `A(${x}) = ${runningTotal}`,
    ptrAExp: null,
    ptrBExp: null,
    resultTailExp: null,
    activeResultExp: null,
    isMergeFlash: false,
    resultSnapshot: [{ coeff: runningTotal, exp: 0 }],
    isFinished: true
  });

  return { total: runningTotal, steps };
}

/**
 * ============================================================================
 * STATE MANAGEMENT & DOM INTERACTION
 * ============================================================================
 */

// Memory stores for user inputs so degree changes preserve typed values
const storedCoeffsA = {};
const storedCoeffsB = {};

// Animation State
let recordedSteps = [];
let currentStepIndex = 0;
let playbackTimer = null;
let currentOpName = "add";

/**
 * Build Degree-based coefficient input boxes.
 * Generates exactly degree + 1 inputs for powers degree down to 0.
 * Preserves previously typed values.
 */
function buildCoeffInputs(polyKey, degree, initialValues = null) {
  const container = document.getElementById(`coeffs${polyKey}`);
  const store = polyKey === "A" ? storedCoeffsA : storedCoeffsB;
  container.innerHTML = "";

  // If initial values provided, seed the store
  if (initialValues) {
    Object.keys(initialValues).forEach(exp => {
      store[exp] = String(initialValues[exp]);
    });
  }

  for (let exp = degree; exp >= 0; exp--) {
    const item = document.createElement("div");
    item.className = "coeff-item";

    const label = document.createElement("label");
    label.className = "coeff-label";
    label.setAttribute("for", `coeff_${polyKey}_${exp}`);
    if (exp > 1) {
      label.innerHTML = `x<sup>${exp}</sup>`;
    } else if (exp === 1) {
      label.innerHTML = "x";
    } else {
      label.innerHTML = "x<sup>0</sup> (const)";
    }

    const input = document.createElement("input");
    input.type = "text";
    input.id = `coeff_${polyKey}_${exp}`;
    input.className = "coeff-input";
    input.dataset.poly = polyKey;
    input.dataset.exp = exp;
    input.placeholder = "0";
    input.autocomplete = "off";
    input.spellcheck = false;

    // Preserve existing value or treat as empty
    input.value = store[exp] !== undefined ? store[exp] : "";

    // Input listener for live validation, storage, and preview
    input.addEventListener("input", () => {
      store[exp] = input.value;
      updatePolyFromInputs(polyKey);
    });

    // Press Enter to quickly compute/run current operation
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        runOperation(currentOpName);
      }
    });

    item.appendChild(label);
    item.appendChild(input);
    container.appendChild(item);
  }

  updatePolyFromInputs(polyKey);
}

/**
 * Validates inputs for a given polynomial, builds its singly linked list,
 * updates live preview text, and flags invalid inputs.
 */
function updatePolyFromInputs(polyKey) {
  const errorEl = document.getElementById(polyKey === "A" ? "aError" : "bError");
  const previewEl = document.getElementById(polyKey === "A" ? "previewA" : "previewB");
  errorEl.textContent = "";

  const container = document.getElementById(`coeffs${polyKey}`);
  const inputs = container.querySelectorAll(".coeff-input");

  let isValid = true;
  const poly = new Polynomial();

  inputs.forEach(input => {
    input.classList.remove("has-error");
    const rawVal = input.value.trim();
    const exp = parseInt(input.dataset.exp, 10);

    if (rawVal === "") {
      // Empty box treated as 0 (valid, creates no node)
      return;
    }

    // Number validation: accept integers, decimals, negative
    const num = Number(rawVal);
    if (!Number.isFinite(num) || isNaN(num)) {
      input.classList.add("has-error");
      errorEl.textContent = `Invalid number at x^${exp}: "${rawVal}". Please enter a valid number (e.g. 3, -2.5).`;
      isValid = false;
      return;
    }

    if (num !== 0) {
      poly.insertTerm(num, exp);
    }
  });

  if (isValid) {
    previewEl.textContent = poly.toString();
    // Update the static linked list visualizer for this polynomial
    renderStaticList(poly, polyKey === "A" ? "pList" : "qList", polyKey === "A" ? "pCount" : "qCount");
    return poly;
  } else {
    previewEl.textContent = "(invalid input)";
    return null;
  }
}

/** Get validated polynomials for A and B */
function getValidatedPolynomials() {
  const polyA = updatePolyFromInputs("A");
  const polyB = updatePolyFromInputs("B");
  if (!polyA || !polyB) return null;
  return { polyA, polyB };
}

/**
 * Render Linked List UI:
 * Draws boxes [ coeff | exp | next ] -> ... -> NULL
 */
function renderStaticList(poly, targetId, countId) {
  const target = document.getElementById(targetId);
  const countEl = document.getElementById(countId);
  countEl.textContent = `${poly.length} node${poly.length === 1 ? "" : "s"}`;

  if (!poly.head) {
    target.innerHTML = '<div class="empty-list">NULL (zero polynomial; 0 nodes)</div>';
    return;
  }

  target.innerHTML = "";
  const nodesRow = document.createElement("div");
  nodesRow.className = "nodes";

  let curr = poly.head;
  let index = 0;

  while (curr !== null) {
    const nodeContainer = document.createElement("div");
    nodeContainer.className = "node-container";
    nodeContainer.dataset.exp = curr.exp;

    const box = document.createElement("div");
    box.className = "node";
    box.dataset.exp = curr.exp;
    box.innerHTML = `
      <div class="cell"><small>coeff</small>${escapeHtml(formatNumber(curr.coeff))}</div>
      <div class="cell"><small>exp</small>${curr.exp}</div>
      <div class="cell"><small>next</small>→</div>
    `;
    nodeContainer.appendChild(box);
    nodesRow.appendChild(nodeContainer);

    const arrow = document.createElement("span");
    arrow.className = "arrow";
    arrow.textContent = "→";
    nodesRow.appendChild(arrow);

    curr = curr.next;
    index++;
  }

  const nullBox = document.createElement("span");
  nullBox.className = "null";
  nullBox.textContent = "NULL";
  nodesRow.appendChild(nullBox);

  target.appendChild(nodesRow);
}

/**
 * ============================================================================
 * ANIMATION ENGINE & CONTROLS
 * ============================================================================
 */

function setupAnimation(steps, finalResult, opTitle, complexity, vivaNotes) {
  pauseAnimation();
  recordedSteps = steps;
  currentStepIndex = 0;

  // Render Step Log List
  renderStepLog(steps);

  // Update operation theory & viva helper
  document.getElementById("operationLabel").textContent = opTitle;
  document.getElementById("complexity").textContent = `Complexity: ${complexity}`;
  document.getElementById("explanation").textContent = vivaNotes;
  document.getElementById("result").textContent = finalResult ? finalResult.toString() : "—";
  document.getElementById("status").textContent = `Generated ${steps.length} execution step${steps.length === 1 ? "" : "s"}. Ready to play.`;

  // Display initial step
  renderCurrentStep();
}

/** Renders the current state from recordedSteps[currentStepIndex] */
function renderCurrentStep() {
  if (!recordedSteps || re
