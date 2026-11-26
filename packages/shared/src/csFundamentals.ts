import { z } from "zod";

export const CS_SUBJECTS = [
  "Operating Systems",
  "DBMS",
  "SQL & Query Patterns",
  "Computer Networks",
  "OOP & Software Engineering",
  "System Design",
] as const;

export const CsSubjectSchema = z.enum(CS_SUBJECTS);
export type CsSubject = z.infer<typeof CsSubjectSchema>;

export const CsTopicPrioritySchema = z.enum([
  "MUST_KNOW",
  "IMPORTANT",
  "ADVANCED",
]);
export type CsTopicPriority = z.infer<typeof CsTopicPrioritySchema>;

export const CsTopicStatusSchema = z.enum([
  "UNSTUDIED",
  "LEARNED",
  "REVISION",
]);
export type CsTopicStatus = z.infer<typeof CsTopicStatusSchema>;

export const CsExampleLanguageSchema = z.enum([
  "sql",
  "java",
  "python",
  "cpp",
  "javascript",
  "text",
]);
export type CsExampleLanguage = z.infer<typeof CsExampleLanguageSchema>;

export const CsFundamentalItemSchema = z.object({
  order: z.number().int().positive(),
  slug: z.string().min(1),
  title: z.string().min(1),
  subject: CsSubjectSchema,
  subTopic: z.string().min(1),
  priority: CsTopicPrioritySchema,
  companies: z.array(z.string()),
  oneLineHook: z.string().min(1),
});
export type CsFundamentalItem = z.infer<typeof CsFundamentalItemSchema>;

export const UpdateCsProgressSchema = z.object({
  status: CsTopicStatusSchema.optional(),
  notes: z.string().max(4000).nullable().optional(),
});
export type UpdateCsProgressInput = z.infer<typeof UpdateCsProgressSchema>;

export interface CsTopicWithProgress extends CsFundamentalItem {
  status: CsTopicStatus;
  notes: string | null;
  updatedAt: string | null;
}

export interface CsSubjectSummary {
  subject: CsSubject;
  total: number;
  learned: number;
  revision: number;
}

export interface CsFundamentalsSummary {
  total: number;
  learned: number;
  revision: number;
  unstudied: number;
  byPriority: {
    MUST_KNOW: { total: number; learned: number };
    IMPORTANT: { total: number; learned: number };
    ADVANCED: { total: number; learned: number };
  };
  subjects: CsSubjectSummary[];
}

export type CsVisualType = "CODE" | "DIAGRAM";

export interface CsWalkthroughDto {
  topicSlug: string;
  title: string;
  subject: CsSubject;
  conceptBreakdown: string;
  realWorldAnalogy: string;
  visualType: CsVisualType;
  visualTitle: string;
  codeOrQueryExample: string;
  exampleLanguage: "sql" | "java" | "python" | "cpp" | "javascript";
  diagramFlow: string;
  comparisonPoints: Array<{ aspect: string; detail: string }>;
  interviewQuestions: Array<{ question: string; answer: string }>;
  commonTraps: string[];
  providerUsed: "GROQ" | "OLLAMA" | "FALLBACK";
}

type RawCsTuple = [
  title: string,
  slug: string,
  subTopic: string,
  priority: CsTopicPriority,
  companies: string[],
  oneLineHook: string,
];

function buildSubject(
  subject: CsSubject,
  rows: RawCsTuple[]
): Array<Omit<CsFundamentalItem, "order">> {
  return rows.map(([title, slug, subTopic, priority, companies, oneLineHook]) => ({
    title,
    slug,
    subject,
    subTopic,
    priority,
    companies,
    oneLineHook,
  }));
}

const RAW_TOPICS: Array<Omit<CsFundamentalItem, "order">> = [
  // ── 1. Operating Systems (28) ─────────────────────────────────────────────
  ...buildSubject("Operating Systems", [
    ["OS Kernel vs User Mode & System Calls", "os-kernel-user-mode-syscalls", "OS Architecture", "MUST_KNOW", ["Microsoft", "Amazon", "Google"], "Dual-mode execution protects hardware; user programs trap into kernel via syscalls."],
    ["Process vs Thread & PCB vs TCB", "os-process-vs-thread", "Processes & Threads", "MUST_KNOW", ["Amazon", "Microsoft", "Meta"], "Processes own isolated address spaces; threads share heap/code and keep private stacks/registers."],
    ["Process States & Lifecycle (5/7-State Model)", "os-process-states-lifecycle", "Processes & Threads", "MUST_KNOW", ["Amazon", "Oracle"], "Tracks transitions across New, Ready, Running, Waiting/Blocked, Suspended, and Terminated."],
    ["Context Switching & Mode Switching", "os-context-switching", "Processes & Threads", "MUST_KNOW", ["Google", "Microsoft"], "Saves CPU registers, PC, and memory map to PCB and loads next process state."],
    ["Multithreading Models (1:1, N:1, M:N)", "os-multithreading-models", "Processes & Threads", "IMPORTANT", ["Google", "Meta"], "Maps user-level threads to kernel-level threads for concurrency vs syscall overhead."],
    ["Inter-Process Communication (IPC): Pipes, Shared Memory & Sockets", "os-ipc-mechanisms", "Processes & Threads", "MUST_KNOW", ["Amazon", "Microsoft", "Cisco"], "Shared memory is fastest after setup; message passing/pipes synchronize via kernel."],
    ["Fork(), Exec() & Zombie vs Orphan Processes", "os-fork-exec-zombie-orphan", "Processes & Threads", "IMPORTANT", ["Amazon", "Oracle", "Qualcomm"], "Zombie holds exit status until wait(); orphan is reparented to init/PID 1."],
    ["CPU Scheduling Criteria & Preemptive vs Non-Preemptive", "os-cpu-scheduling-criteria", "CPU Scheduling", "MUST_KNOW", ["Amazon", "Microsoft"], "Balances throughput, turnaround time, waiting time, response time, and fairness."],
    ["FCFS, SJF & SRTF Scheduling", "os-fcfs-sjf-srtf", "CPU Scheduling", "MUST_KNOW", ["Amazon", "Flipkart"], "SJF/SRTF minimize average waiting time but risk starvation for long bursts."],
    ["Round Robin & Time Quantum Trade-offs", "os-round-robin-quantum", "CPU Scheduling", "MUST_KNOW", ["Microsoft", "Adobe"], "Too small quantum increases context-switch overhead; too large degrades to FCFS."],
    ["Priority Scheduling, Aging & Multi-Level Feedback Queue", "os-priority-mlfq", "CPU Scheduling", "IMPORTANT", ["Google", "Microsoft"], "Aging prevents starvation; MLFQ demotes CPU-bound jobs and favors interactive I/O."],
    ["Race Condition & Critical Section Problem", "os-critical-section-race-condition", "Synchronization", "MUST_KNOW", ["Amazon", "Meta", "Microsoft"], "Requires Mutual Exclusion, Progress, and Bounded Waiting for correctness."],
    ["Mutex vs Binary Semaphore vs Counting Semaphore", "os-mutex-vs-semaphore", "Synchronization", "MUST_KNOW", ["Amazon", "Microsoft", "Qualcomm"], "Mutex has strict lock ownership; semaphores are signaling counters usable across threads."],
    ["Monitors & Condition Variables", "os-monitors-condition-variables", "Synchronization", "IMPORTANT", ["Google", "Meta"], "Encapsulates shared data + lock + wait()/notify() queues (used by Java synchronized)."],
    ["Classic Sync Problems: Producer-Consumer, Readers-Writers, Dining Philosophers", "os-classic-sync-problems", "Synchronization", "MUST_KNOW", ["Amazon", "Microsoft", "Oracle"], "Canonical patterns for bounded buffers, reader/writer fairness, and circular deadlock avoidance."],
    ["Deadlock Necessary Conditions (Coffman's 4 Conditions)", "os-deadlock-coffman-conditions", "Deadlocks", "MUST_KNOW", ["Amazon", "Google", "Microsoft"], "Mutual Exclusion, Hold & Wait, No Preemption, and Circular Wait must all hold simultaneously."],
    ["Deadlock Prevention, Avoidance (Banker's Algorithm) & Detection", "os-deadlock-prevention-bankers", "Deadlocks", "IMPORTANT", ["Amazon", "Oracle"], "Break any Coffman condition to prevent, or simulate safe sequences via Banker's."],
    ["Livelock vs Starvation vs Deadlock", "os-livelock-starvation-deadlock", "Deadlocks", "IMPORTANT", ["Microsoft", "Adobe"], "Deadlock blocks forever; livelock keeps changing state without progress; starvation delays indefinitely."],
    ["Logical vs Physical Address & MMU", "os-logical-physical-address-mmu", "Memory Management", "MUST_KNOW", ["Qualcomm", "Microsoft"], "CPU emits virtual/logical addresses translated by MMU into physical RAM frames."],
    ["Contiguous Allocation: Internal vs External Fragmentation", "os-fragmentation-allocation", "Memory Management", "MUST_KNOW", ["Amazon", "Oracle"], "Fixed partitions suffer internal waste; variable partitions suffer external holes."],
    ["Paging, Page Table & Multi-Level Page Tables", "os-paging-multilevel-tables", "Virtual Memory", "MUST_KNOW", ["Google", "Microsoft", "Amazon"], "Eliminates external fragmentation via fixed frames; hierarchical tables save RAM."],
    ["TLB (Translation Lookaside Buffer) & Effective Access Time", "os-tlb-effective-access-time", "Virtual Memory", "MUST_KNOW", ["Google", "Qualcomm", "Nvidia"], "Hardware associative cache for PTEs; TLB hit avoids extra memory lookups."],
    ["Segmentation vs Paging & Segmented Paging", "os-segmentation-vs-paging", "Virtual Memory", "IMPORTANT", ["Microsoft", "Cisco"], "Segmentation models logical program units; paging simplifies physical frame allocation."],
    ["Virtual Memory, Demand Paging & Page Fault Handling", "os-virtual-memory-demand-paging", "Virtual Memory", "MUST_KNOW", ["Amazon", "Google", "Microsoft"], "Loads pages lazily on page fault trap from disk swap into a free RAM frame."],
    ["Page Replacement Algorithms (FIFO, Optimal, LRU, Clock) & Belady's Anomaly", "os-page-replacement-belady", "Virtual Memory", "MUST_KNOW", ["Amazon", "Microsoft"], "LRU approximates Optimal; FIFO suffers Belady's anomaly where more frames increase faults."],
    ["Thrashing & Working Set Model", "os-thrashing-working-set", "Virtual Memory", "IMPORTANT", ["Google", "Amazon"], "Occurs when active working sets exceed RAM, causing continuous paging and CPU collapse."],
    ["File Systems, Inodes, Hard Links vs Soft Links", "os-file-systems-inodes-links", "File Systems & I/O", "IMPORTANT", ["Meta", "Amazon", "Google"], "Inode stores metadata & block pointers; hard link shares inode, symlink stores target path."],
    ["Boot Process, BIOS/UEFI & OS Initialization", "os-boot-process-bios-uefi", "OS Architecture", "IMPORTANT", ["Microsoft", "Qualcomm"], "POST -> BIOS/UEFI -> Bootloader (GRUB) -> Kernel init -> PID 1 user-space startup."],
    ["I/O Polling, Interrupts & DMA (Direct Memory Access)", "os-io-polling-interrupts-dma", "File Systems & I/O", "IMPORTANT", ["Qualcomm", "Nvidia", "Amazon"], "DMA transfers bulk I/O directly to RAM, interrupting CPU only on completion."],
    ["Disk Scheduling (FCFS, SSTF, SCAN, C-SCAN) & RAID Levels", "os-disk-scheduling-raid", "File Systems & I/O", "ADVANCED", ["Oracle", "Dell", "Amazon"], "SCAN/C-SCAN bound seek starvation; RAID 0/1/5/10 trade capacity, parity, and fault tolerance."],
  ]),

  // ── 2. DBMS (26) ──────────────────────────────────────────────────────────
  ...buildSubject("DBMS", [
    ["DBMS Architecture & 3-Schema Data Independence", "dbms-three-schema-architecture", "Foundations", "IMPORTANT", ["Oracle", "Amazon"], "Separates External (views), Conceptual (logical), and Internal (physical storage) schemas."],
    ["ER Model: Weak Entities, Cardinality & Generalization", "dbms-er-model-cardinality", "Data Modeling", "MUST_KNOW", ["Amazon", "Flipkart"], "Weak entities depend on owner key; ER diagrams map directly to relational tables."],
    ["Keys in DBMS: Super, Candidate, Primary, Alternate & Foreign Key", "dbms-keys-taxonomy", "Relational Model", "MUST_KNOW", ["Amazon", "Microsoft", "Goldman Sachs"], "Candidate keys are minimal super keys; foreign keys enforce referential integrity."],
    ["Referential Integrity & ON DELETE CASCADE / SET NULL", "dbms-referential-integrity", "Relational Model", "MUST_KNOW", ["Amazon", "Oracle"], "Prevents orphan foreign keys via RESTRICT, CASCADE, SET NULL, or SET DEFAULT."],
    ["Relational Algebra: Selection, Projection, Join & Division", "dbms-relational-algebra", "Relational Model", "IMPORTANT", ["Oracle", "Microsoft"], "Procedural query foundation underlying SQL query optimization trees."],
    ["Functional Dependencies & Armstrong's Axioms", "dbms-functional-dependencies", "Normalization", "MUST_KNOW", ["Amazon", "Oracle"], "X -> Y means X uniquely determines Y; used to compute attribute closures & candidate keys."],
    ["Normalization: 1NF, 2NF, 3NF & BCNF", "dbms-normalization-1nf-bcnf", "Normalization", "MUST_KNOW", ["Amazon", "Microsoft", "Flipkart"], "Eliminates partial (2NF), transitive (3NF), and non-superkey determinant (BCNF) anomalies."],
    ["Lossless-Join vs Dependency-Preserving Decomposition", "dbms-lossless-dependency-preserving", "Normalization", "IMPORTANT", ["Oracle", "Amazon"], "3NF guarantees both; BCNF guarantees lossless join but may sacrifice dependency preservation."],
    ["Denormalization Trade-offs in OLTP vs OLAP", "dbms-denormalization-oltp-olap", "Normalization", "IMPORTANT", ["Amazon", "Uber", "Meta"], "Trades controlled write redundancy to avoid expensive multi-table joins on read-heavy paths."],
    ["Transactions & ACID Properties", "dbms-transactions-acid", "Transactions", "MUST_KNOW", ["Amazon", "Google", "Goldman Sachs"], "Atomicity, Consistency, Isolation, and Durability guarantee reliable state transitions."],
    ["BASE vs ACID & Eventual Consistency", "dbms-acid-vs-base", "Transactions", "IMPORTANT", ["Amazon", "Uber"], "Distributed NoSQL systems favor Availability and Partition tolerance over strict ACID."],
    ["Serializability: Conflict vs View Serializability", "dbms-serializability-conflict-view", "Concurrency Control", "MUST_KNOW", ["Oracle", "Amazon"], "Concurrent schedule is conflict-serializable iff its precedence graph is acyclic."],
    ["Concurrency Anomalies: Dirty Read, Non-Repeatable Read & Phantom Read", "dbms-concurrency-anomalies", "Concurrency Control", "MUST_KNOW", ["Amazon", "Microsoft", "Uber"], "Occur when uncommitted writes, re-read updates, or newly inserted rows leak across txns."],
    ["SQL Isolation Levels (Read Uncommitted -> Serializable)", "dbms-sql-isolation-levels", "Concurrency Control", "MUST_KNOW", ["Amazon", "Meta", "Uber"], "PostgreSQL Repeatable Read uses Snapshot Isolation; Serializable uses SSI."],
    ["Two-Phase Locking (2PL), Strict 2PL & Deadlock Handling", "dbms-two-phase-locking", "Concurrency Control", "MUST_KNOW", ["Oracle", "Amazon"], "Growing phase acquires locks, shrinking releases; Strict 2PL holds X-locks until commit."],
    ["Optimistic Concurrency Control (OCC) vs Pessimistic Locking", "dbms-occ-vs-pessimistic-locking", "Concurrency Control", "IMPORTANT", ["Amazon", "Stripe", "Uber"], "Pessimistic locks upfront; OCC validates version/timestamp at commit for low-contention workloads."],
    ["Timestamp Ordering & Thomas Write Rule", "dbms-timestamp-ordering-protocol", "Concurrency Control", "IMPORTANT", ["Oracle", "Amazon"], "Orders conflicting reads/writes by transaction start timestamp; Thomas Write ignores obsolete writes."],
    ["Database Deadlock Prevention (Wait-Die, Wound-Wait) & Detection", "dbms-deadlock-wait-die-wound-wait", "Concurrency Control", "IMPORTANT", ["Oracle", "Microsoft", "Amazon"], "Wait-Die is non-preemptive (older waits); Wound-Wait is preemptive (older aborts younger)."],
    ["MVCC (Multi-Version Concurrency Control) Internals", "dbms-mvcc-internals", "Concurrency Control", "ADVANCED", ["Google", "Meta", "Databricks"], "Readers see snapshot versions without blocking writers, and writers don't block readers."],
    ["Indexing Internals: B-Tree vs B+ Tree", "dbms-btree-vs-bplus-tree", "Indexing & Storage", "MUST_KNOW", ["Amazon", "Google", "Microsoft"], "B+ Trees store data pointers only in linked leaves, enabling fast range scans and high fan-out."],
    ["Clustered vs Non-Clustered (Secondary) Indexes", "dbms-clustered-vs-non-clustered-index", "Indexing & Storage", "MUST_KNOW", ["Amazon", "Microsoft", "Flipkart"], "Clustered dictates physical row order (1 per table); secondary stores key -> PK/RID pointer."],
    ["Composite Indexes & Leftmost Prefix Rule", "dbms-composite-index-leftmost-prefix", "Indexing & Storage", "MUST_KNOW", ["Amazon", "Uber", "Meta"], "Index on (a, b, c) accelerates (a), (a, b), and (a, b, c), but not (b, c) alone."],
    ["Covering Index & Hash Indexing Limitations", "dbms-covering-hash-index", "Indexing & Storage", "IMPORTANT", ["Meta", "Amazon"], "Covering index satisfies queries via index-only scan; hash indexes fail on range predicates."],
    ["Write-Ahead Logging (WAL), Checkpointing & ARIES Recovery", "dbms-wal-checkpoints-aries", "Recovery & Internals", "ADVANCED", ["Google", "Databricks", "Oracle"], "Logs changes sequentially to WAL before dirty pages flush, enabling REDO/UNDO crash recovery."],
    ["Query Execution Pipeline & EXPLAIN / ANALYZE", "dbms-query-execution-explain", "Query Optimization", "MUST_KNOW", ["Amazon", "Uber", "Meta"], "Parser -> Rewriter -> Cost-Based Optimizer (Seq Scan vs Index Scan) -> Executor."],
    ["Database Connection Pooling (PgBouncer / HikariCP)", "dbms-connection-pooling", "Operations", "IMPORTANT", ["Uber", "Stripe", "Amazon"], "Reuses persistent TCP/DB connections to prevent process-fork and handshake exhaustion."],
    ["SQL vs NoSQL (Document, Key-Value, Columnar, Graph)", "dbms-sql-vs-nosql-models", "Data Models", "MUST_KNOW", ["Amazon", "Meta", "Google"], "Choose relational for complex joins/ACID; NoSQL for flexible schemas or massive write scale."],
    ["Read Replicas, Write Amplification & Vacuuming", "dbms-replicas-vacuum-bloat", "Operations", "ADVANCED", ["Meta", "Uber"], "MVCC dead tuples require autovacuum; excessive indexes slow down writes."],
  ]),

  // ── 3. SQL & Query Patterns (28) ──────────────────────────────────────────
  ...buildSubject("SQL & Query Patterns", [
    ["DDL, DML, DCL & TCL Commands", "sql-ddl-dml-dcl-tcl", "SQL Foundations", "MUST_KNOW", ["Amazon", "Oracle", "Microsoft"], "Categorizes schema (CREATE/ALTER), data (SELECT/INSERT), permissions (GRANT), and txns (COMMIT)."],
    ["DELETE vs TRUNCATE vs DROP", "sql-delete-vs-truncate-vs-drop", "SQL Foundations", "MUST_KNOW", ["Amazon", "Oracle", "Flipkart"], "DELETE is row-by-row DML (rollbackable); TRUNCATE resets pages (DDL); DROP removes table schema."],
    ["SQL Execution Order (FROM -> WHERE -> GROUP BY -> HAVING -> SELECT -> ORDER BY -> LIMIT)", "sql-logical-execution-order", "SQL Foundations", "MUST_KNOW", ["Amazon", "Meta", "Google"], "Explains why column aliases in SELECT cannot be referenced in WHERE."],
    ["INNER, LEFT, RIGHT, FULL OUTER & CROSS JOIN", "sql-joins-taxonomy", "Joins", "MUST_KNOW", ["Amazon", "Microsoft", "Flipkart"], "Understand row multiplication on non-unique keys and NULL padding on outer joins."],
    ["SELF JOIN Patterns (Employee-Manager & Consecutive Rows)", "sql-self-join-patterns", "Joins", "MUST_KNOW", ["Amazon", "Meta", "Oracle"], "Join a table to itself with distinct aliases to compare rows within the same table."],
    ["Anti-Join Patterns: LEFT JOIN ... IS NULL vs NOT EXISTS vs NOT IN", "sql-anti-join-null-pitfall", "Joins", "MUST_KNOW", ["Amazon", "Meta"], "NOT IN silently returns 0 rows if the subquery contains any NULL; prefer NOT EXISTS."],
    ["NULL Handling: COALESCE, NULLIF & Three-Valued Logic", "sql-null-three-valued-logic", "SQL Foundations", "MUST_KNOW", ["Amazon", "Google"], "NULL = NULL evaluates to UNKNOWN; use IS NULL, COALESCE, and COUNT(*) vs COUNT(col)."],
    ["GROUP BY, HAVING vs WHERE & Aggregate Functions", "sql-group-by-having-where", "Aggregations", "MUST_KNOW", ["Amazon", "Microsoft"], "WHERE filters raw rows pre-grouping; HAVING filters aggregated groups post-grouping."],
    ["Conditional Aggregation (SUM(CASE WHEN ...)) & Pivoting", "sql-conditional-aggregation-pivot", "Aggregations", "MUST_KNOW", ["Meta", "Uber", "Amazon"], "Compute multiple filtered metrics in a single table scan without self-joins."],
    ["UNION vs UNION ALL & Set Operations (INTERSECT, EXCEPT)", "sql-union-vs-union-all", "Set Operations", "MUST_KNOW", ["Amazon", "Oracle"], "UNION ALL skips expensive deduplication sort/hash when duplicates are impossible or desired."],
    ["Correlated vs Uncorrelated Subqueries & EXISTS", "sql-subqueries-correlated-exists", "Subqueries & CTEs", "MUST_KNOW", ["Amazon", "Microsoft"], "EXISTS short-circuits on first match; correlated subqueries run per outer row unless unnested."],
    ["CTEs (WITH Clause) & Chained Readability", "sql-ctes-with-clause", "Subqueries & CTEs", "MUST_KNOW", ["Meta", "Amazon", "Google"], "Decompose multi-step analytical queries cleanly into named temporary result sets."],
    ["Recursive CTEs (Hierarchies, Org Charts & Graph Paths)", "sql-recursive-ctes", "Subqueries & CTEs", "ADVANCED", ["Google", "Meta", "Uber"], "Anchor member UNION ALL recursive member terminating when no new rows match."],
    ["Window Functions Overview: OVER (PARTITION BY ... ORDER BY ...)", "sql-window-functions-intro", "Window Functions", "MUST_KNOW", ["Amazon", "Meta", "Google"], "Computes aggregates/ranks across a frame without collapsing rows like GROUP BY."],
    ["ROW_NUMBER() vs RANK() vs DENSE_RANK()", "sql-row-number-rank-dense-rank", "Window Functions", "MUST_KNOW", ["Amazon", "Meta", "Flipkart"], "1,2,3,4 vs 1,2,2,4 (gaps) vs 1,2,2,3 (no gaps) on tie values."],
    ["Nth Highest Salary & Top-K Per Group Pattern", "sql-nth-highest-salary-top-k", "Interview Patterns", "MUST_KNOW", ["Amazon", "Microsoft", "Google"], "Use DENSE_RANK() OVER (PARTITION BY dept ORDER BY salary DESC) <= K."],
    ["LEAD() and LAG() for Time-Series & Session Deltas", "sql-lead-lag-time-series", "Window Functions", "MUST_KNOW", ["Meta", "Uber", "Amazon"], "Access previous/next row values without expensive self-joins."],
    ["Running Totals, Moving Averages & Window Frames (ROWS vs RANGE)", "sql-running-totals-frames", "Window Functions", "IMPORTANT", ["Amazon", "Goldman Sachs"], "ROWS BETWEEN 6 PRECEDING AND CURRENT ROW handles exact physical row windows."],
    ["Deduplicating Rows (ROW_NUMBER() = 1 vs DELETE Self-Join)", "sql-deduplication-pattern", "Interview Patterns", "MUST_KNOW", ["Amazon", "Meta"], "Partition by natural key, order by latest timestamp, and keep rn = 1."],
    ["Gaps and Islands Problem (Consecutive Dates / Numbers)", "sql-gaps-and-islands", "Interview Patterns", "ADVANCED", ["Meta", "Google", "Uber"], "Group by (value - ROW_NUMBER()) or (date - INTERVAL rn DAY) to detect streaks."],
    ["Median & Percentile Calculation (PERCENTILE_CONT / NTILE)", "sql-median-percentile-ntile", "Window Functions", "IMPORTANT", ["Meta", "Uber"], "Use PERCENTILE_CONT(0.5) or rank ascending/descending counts to compute median."],
    ["User Retention, Funnel & Cohort Analysis Queries", "sql-retention-cohort-funnel", "Interview Patterns", "IMPORTANT", ["Meta", "Amazon", "Swiggy"], "Self-join or MIN(login_date) OVER (PARTITION BY user_id) for Day-1/Day-7 retention."],
    ["Date/Time Manipulation & Overlapping Intervals in SQL", "sql-date-intervals-overlap", "Interview Patterns", "IMPORTANT", ["Uber", "Airbnb", "Amazon"], "Two ranges [s1, e1] and [s2, e2] overlap iff s1 <= e2 AND s2 <= e1."],
    ["Views vs Materialized Views", "sql-views-vs-materialized-views", "Schema & Objects", "IMPORTANT", ["Oracle", "Amazon"], "Views are saved virtual queries; materialized views persist precomputed results on disk."],
    ["Stored Procedures, Triggers & User-Defined Functions", "sql-procedures-triggers-udf", "Schema & Objects", "IMPORTANT", ["Oracle", "Microsoft"], "Encapsulate DB-side logic; beware hidden trigger cascades and lock contention."],
    ["SQL Injection & Parameterized Prepared Statements", "sql-injection-prepared-statements", "Security", "MUST_KNOW", ["Amazon", "Google", "Meta"], "Always bind parameters separately from SQL syntax; never concatenate raw user input."],
    ["SARGable Queries & Index-Friendly WHERE Clauses", "sql-sargable-query-optimization", "Query Optimization", "IMPORTANT", ["Amazon", "Uber", "Meta"], "Avoid wrapping indexed columns in functions (e.g., YEAR(dt) = 2025) or leading '%abc'."],
    ["Keyset (Cursor) Pagination vs OFFSET Pagination", "sql-keyset-vs-offset-pagination", "Query Optimization", "IMPORTANT", ["Meta", "Uber", "Stripe"], "OFFSET scans and discards rows; WHERE (created_at, id) < (...) stays O(log N)."],
  ]),

  // ── 4. Computer Networks (26) ─────────────────────────────────────────────
  ...buildSubject("Computer Networks", [
    ["OSI 7-Layer Model vs TCP/IP 4/5-Layer Model", "cn-osi-vs-tcpip-model", "Network Models", "MUST_KNOW", ["Cisco", "Amazon", "Microsoft"], "Maps Application, Transport, Network, Data Link, and Physical layers & PDUs."],
    ["Encapsulation, Decapsulation, Hub vs Switch vs Router", "cn-encapsulation-switch-router", "Network Models", "MUST_KNOW", ["Cisco", "Amazon"], "Switches forward Layer-2 frames via MAC tables; routers forward Layer-3 packets via IP."],
    ["IPv4 vs IPv6, Private IP Ranges & Loopback", "cn-ipv4-ipv6-private-ranges", "Network Layer", "MUST_KNOW", ["Cisco", "Amazon", "Google"], "RFC 1918 private blocks (10.0.0.0/8, 172.16/12, 192.168/16) and 128-bit IPv6."],
    ["Subnetting, CIDR Notation & Subnet Masks", "cn-subnetting-cidr", "Network Layer", "MUST_KNOW", ["Cisco", "Amazon", "Cloudflare"], "/N allocates N network bits and (32 - N) host bits; usable hosts = 2^(32-N) - 2."],
    ["ARP (Address Resolution Protocol) & RARP", "cn-arp-protocol", "Link & Network Layer", "IMPORTANT", ["Cisco", "Qualcomm"], "Broadcasts ARP request to resolve a local IPv4 address into a MAC address."],
    ["DHCP (DORA: Discover, Offer, Request, Ack)", "cn-dhcp-dora", "Network Layer", "IMPORTANT", ["Cisco", "Microsoft"], "Dynamically leases IP, subnet mask, default gateway, and DNS servers."],
    ["NAT (Network Address Translation) & PAT (Port Forwarding)", "cn-nat-and-pat", "Network Layer", "MUST_KNOW", ["Cisco", "Amazon", "Cloudflare"], "Maps multiple private LAN IPs to a single public IP using distinct source ports."],
    ["ICMP, Ping & Traceroute Internals", "cn-icmp-ping-traceroute", "Network Layer", "IMPORTANT", ["Google", "Cloudflare"], "Traceroute increments IP TTL from 1 to elicit ICMP Time Exceeded from each hop."],
    ["Routing Protocols: Distance Vector (RIP) vs Link State (OSPF) vs BGP", "cn-routing-protocols-rip-ospf-bgp", "Network Layer", "IMPORTANT", ["Cisco", "Cloudflare", "Amazon"], "RIP uses Bellman-Ford hop counts; OSPF uses Dijkstra link-state; BGP routes between ASes."],
    ["SMTP, POP3, IMAP & FTP/SSH Application Protocols", "cn-email-ftp-ssh-protocols", "Application Layer", "IMPORTANT", ["Cisco", "Microsoft"], "SMTP pushes mail (25/587), IMAP syncs folders, SSH encrypts remote shell over port 22."],
    ["TCP vs UDP: Reliability, Ordering & Use Cases", "cn-tcp-vs-udp", "Transport Layer", "MUST_KNOW", ["Amazon", "Google", "Meta"], "TCP guarantees ordered byte streams; UDP offers low-latency datagrams (DNS, VoIP, QUIC)."],
    ["TCP 3-Way Handshake (SYN, SYN-ACK, ACK) & SYN Flood", "cn-tcp-3-way-handshake", "Transport Layer", "MUST_KNOW", ["Amazon", "Google", "Cloudflare"], "Synchronizes sequence numbers; SYN cookies mitigate half-open SYN flood DoS attacks."],
    ["TCP 4-Way Teardown & TIME_WAIT State", "cn-tcp-4-way-teardown-time-wait", "Transport Layer", "IMPORTANT", ["Google", "Meta", "Uber"], "TIME_WAIT (2*MSL) ensures delayed packets don't corrupt a reused port."],
    ["TCP Flow Control (Sliding Window) vs Congestion Control (AIMD, Slow Start)", "cn-tcp-flow-vs-congestion-control", "Transport Layer", "MUST_KNOW", ["Google", "Amazon", "Cisco"], "rwnd protects receiver buffer; cwnd prevents network router overload."],
    ["TCP Error Control: Checksums, Retransmission & Fast Retransmit", "cn-tcp-error-control-retransmit", "Transport Layer", "IMPORTANT", ["Cisco", "Amazon"], "3 duplicate ACKs trigger Fast Retransmit without waiting for RTO timer expiry."],
    ["Socket Lifecycle (socket, bind, listen, accept, connect)", "cn-socket-lifecycle", "Transport Layer", "IMPORTANT", ["Microsoft", "Amazon", "Uber"], "OS syscalls managing listening queues and per-client file descriptors."],
    ["DNS Resolution Flow (Browser Cache -> Recursive -> Root -> TLD -> Auth)", "cn-dns-resolution-flow", "Application Layer", "MUST_KNOW", ["Google", "Amazon", "Cloudflare"], "Translates hostnames to A/AAAA/CNAME records cached by TTL."],
    ["HTTP Methods, Idempotency & Status Codes (2xx, 3xx, 4xx, 5xx)", "cn-http-methods-status-codes", "Application Layer", "MUST_KNOW", ["Amazon", "Stripe", "Meta"], "GET/PUT/DELETE are idempotent; POST is not; know 401 vs 403, 429, 502 vs 504."],
    ["HTTP/1.1 vs HTTP/2 vs HTTP/3 (QUIC)", "cn-http1-http2-http3-quic", "Application Layer", "MUST_KNOW", ["Google", "Cloudflare", "Meta"], "HTTP/2 multiplexes over 1 TCP (TCP HoL issue); HTTP/3 uses UDP-based QUIC."],
    ["HTTPS, Symmetric vs Asymmetric Encryption & TLS 1.3 Handshake", "cn-https-tls-handshake", "Security", "MUST_KNOW", ["Google", "Amazon", "Stripe"], "Asymmetric certs authenticate & exchange keys; fast symmetric AES/ChaCha encrypts traffic."],
    ["Cookies vs Sessions vs JWT & CORS / Preflight", "cn-cookies-jwt-cors", "Web & Security", "MUST_KNOW", ["Amazon", "Meta", "Stripe"], "CORS enforces browser Same-Origin Policy via Access-Control-Allow-* headers."],
    ["WebSockets vs Long Polling vs Server-Sent Events (SSE)", "cn-websockets-sse-polling", "Real-Time Protocols", "MUST_KNOW", ["Meta", "Uber", "Slack"], "WebSockets give full-duplex; SSE gives lightweight server-to-client HTTP streaming."],
    ["Forward Proxy vs Reverse Proxy", "cn-forward-vs-reverse-proxy", "Infrastructure", "MUST_KNOW", ["Amazon", "Cloudflare", "Nginx"], "Forward proxy hides clients from servers; reverse proxy hides backend servers from clients."],
    ["Load Balancing: L4 vs L7 & Routing Algorithms", "cn-load-balancers-l4-l7", "Infrastructure", "MUST_KNOW", ["Amazon", "Google", "Uber"], "L4 routes by IP/Port; L7 inspects HTTP headers/paths (Round Robin, Least Conn, IP Hash)."],
    ["CDN (Content Delivery Network) & Edge Caching", "cn-cdn-edge-caching", "Infrastructure", "IMPORTANT", ["Netflix", "Cloudflare", "Meta"], "Anycast + edge PoPs serve static/video assets close to users, cutting origin load & RTT."],
    ["Firewalls, WAF, DDoS Mitigation & VPNs", "cn-firewalls-waf-ddos-vpn", "Security", "IMPORTANT", ["Cloudflare", "Cisco", "Amazon"], "Packet filters check L3/L4; WAF inspects L7 payloads (SQLi/XSS); VPN encrypts tunnels."],
    ["What Happens When You Type a URL in the Browser?", "cn-what-happens-url-browser", "End-to-End Synthesis", "MUST_KNOW", ["Google", "Amazon", "Meta"], "DNS -> TCP + TLS -> HTTP GET -> Reverse Proxy/App/DB -> HTML/CSS/JS Render Pipeline."],
    ["gRPC vs REST vs GraphQL", "cn-grpc-vs-rest-vs-graphql", "API Protocols", "IMPORTANT", ["Google", "Meta", "Uber"], "gRPC uses Protobuf + HTTP/2 for internal microservices; GraphQL avoids over-fetching."],
  ]),

  // ── 5. OOP & Software Engineering (22) ────────────────────────────────────
  ...buildSubject("OOP & Software Engineering", [
    ["4 Pillars of OOP (Encapsulation, Abstraction, Inheritance, Polymorphism)", "oop-four-pillars", "OOP Core", "MUST_KNOW", ["Amazon", "Microsoft", "Adobe"], "Hide internal state, expose contracts, reuse hierarchies, and dispatch dynamically."],
    ["Compile-Time (Overloading) vs Runtime Polymorphism (Overriding)", "oop-static-vs-dynamic-polymorphism", "OOP Core", "MUST_KNOW", ["Amazon", "Oracle", "Microsoft"], "Resolved via method signature at compile time vs vtable/dynamic dispatch at runtime."],
    ["Abstract Class vs Interface (Java / C++ / TS)", "oop-abstract-class-vs-interface", "OOP Core", "MUST_KNOW", ["Amazon", "Microsoft", "Goldman Sachs"], "Abstract classes share state & constructors; interfaces define pure capability contracts."],
    ["Composition over Inheritance & Diamond Problem", "oop-composition-over-inheritance", "OOP Core", "MUST_KNOW", ["Google", "Amazon", "Meta"], "HAS-A composition avoids fragile base classes and multiple-inheritance ambiguity."],
    ["Association, Aggregation & Composition", "oop-association-aggregation-composition", "OOP Relationships", "IMPORTANT", ["Amazon", "Adobe"], "Weak link vs independent HAS-A (Department-Teacher) vs lifetime-owned HAS-A (House-Room)."],
    ["Deep Copy vs Shallow Copy & Immutability", "oop-deep-vs-shallow-copy", "OOP Core", "MUST_KNOW", ["Amazon", "Microsoft"], "Shallow copies references; deep duplicates nested object graphs safely."],
    ["Static Keyword, Final/Const & Access Modifiers", "oop-static-final-access-modifiers", "OOP Core", "MUST_KNOW", ["Amazon", "Oracle", "Microsoft"], "Controls class-level sharing, immutability/override prevention, and package visibility."],
    ["Checked vs Unchecked Exceptions & Try-With-Resources", "oop-checked-vs-unchecked-exceptions", "OOP Core", "MUST_KNOW", ["Amazon", "Oracle", "Goldman Sachs"], "Checked exceptions enforce compile-time handling; unchecked RuntimeExceptions signal logic bugs."],
    ["Memory Model: Stack vs Heap & Garbage Collection (Mark-Sweep, Generational)", "oop-stack-heap-gc", "Runtime & Memory", "IMPORTANT", ["Google", "Oracle", "Amazon"], "Young-gen minor GCs collect short-lived objects fast; major GCs compact tenured heap."],
    ["SOLID Principles: Single Responsibility & Open-Closed (SRP, OCP)", "oop-solid-srp-ocp", "SOLID & Clean Code", "MUST_KNOW", ["Amazon", "Microsoft", "Uber"], "One reason to change per class; extend behavior via abstractions without editing core code."],
    ["SOLID Principles: Liskov, Interface Segregation & Dependency Inversion (LSP, ISP, DIP)", "oop-solid-lsp-isp-dip", "SOLID & Clean Code", "MUST_KNOW", ["Amazon", "Google", "Stripe"], "Subtypes must honor base contracts; depend on interfaces, not concrete implementations."],
    ["Singleton Pattern (Thread-Safe Double-Checked Locking / Enum)", "oop-pattern-singleton", "Creational Patterns", "MUST_KNOW", ["Amazon", "Oracle", "Adobe"], "Ensure single instance with private constructor, volatile field, and synchronized check."],
    ["Factory Method & Abstract Factory Patterns", "oop-pattern-factory", "Creational Patterns", "MUST_KNOW", ["Amazon", "Microsoft", "Uber"], "Decouple object creation from callers so new concrete types plug in cleanly."],
    ["Builder Pattern & Prototype Pattern", "oop-pattern-builder-prototype", "Creational Patterns", "IMPORTANT", ["Google", "Amazon"], "Builder constructs complex immutable objects step-by-step without telescoping constructors."],
    ["Strategy & Observer Patterns", "oop-pattern-strategy-observer", "Behavioral Patterns", "MUST_KNOW", ["Amazon", "Flipkart", "Uber"], "Strategy swaps algorithms at runtime; Observer notifies subscribed listeners on state change."],
    ["Decorator, Adapter & Facade Patterns", "oop-pattern-decorator-adapter-facade", "Structural Patterns", "IMPORTANT", ["Amazon", "Microsoft"], "Decorator wraps dynamic behavior; Adapter translates interfaces; Facade simplifies subsystems."],
    ["Proxy & Flyweight Structural Patterns", "oop-pattern-proxy-flyweight", "Structural Patterns", "IMPORTANT", ["Amazon", "Google"], "Proxy controls access/lazy-loading; Flyweight shares intrinsic immutable state to save RAM."],
    ["Command, State & Chain of Responsibility Patterns", "oop-pattern-command-state-cor", "Behavioral Patterns", "ADVANCED", ["Uber", "Adobe", "Amazon"], "Encapsulates requests (undo/redo), state transitions, and middleware pipelines."],
    ["DRY, KISS, YAGNI & Dependency Injection (IoC)", "se-dry-kiss-yagni-di", "Clean Code", "MUST_KNOW", ["Google", "Stripe", "Amazon"], "DI injects collaborators externally, making classes modular and unit-testable."],
    ["SDLC Models: Waterfall vs Agile / Scrum / Kanban", "se-sdlc-agile-scrum-kanban", "Software Engineering", "IMPORTANT", ["Amazon", "Microsoft", "Atlassian"], "Iterative sprints, daily standups, retrospectives, and WIP-limited Kanban boards."],
    ["Git Workflows: Merge vs Rebase, Cherry-Pick & Branching", "se-git-merge-rebase", "Version Control", "MUST_KNOW", ["Google", "Meta", "Atlassian"], "Merge preserves branch history; rebase replays commits linearly onto updated base."],
    ["Testing Pyramid: Unit, Integration, E2E & Mocking", "se-testing-pyramid-mocking", "Quality Assurance", "MUST_KNOW", ["Google", "Stripe", "Amazon"], "Fast isolated unit tests at base, API/DB integration in middle, selective E2E at top."],
    ["Code Reviews, Linting & Static Analysis", "se-code-reviews-static-analysis", "Engineering Craft", "IMPORTANT", ["Google", "Meta"], "Catch design flaws, security issues, and regressions early via small focused PRs."],
    ["CI/CD Pipelines & Deployment Strategies (Blue-Green, Canary, Rolling)", "se-cicd-blue-green-canary", "DevOps", "IMPORTANT", ["Amazon", "Netflix", "Google"], "Canary shifts small traffic % first; Blue-Green enables instant zero-downtime rollback."],
    ["Concurrency in OOP: Thread Pools, Futures & Immutability", "oop-concurrency-thread-pools", "Runtime & Memory", "IMPORTANT", ["Amazon", "Goldman Sachs"], "Bound thread creation via ExecutorService/worker pools to avoid OOM and thrashing."],
  ]),

  // ── 6. System Design (24) ─────────────────────────────────────────────────
  ...buildSubject("System Design", [
    ["Latency vs Throughput, Bandwidth & Tail Latency (p95/p99)", "sd-latency-throughput-p99", "Core Metrics", "MUST_KNOW", ["Google", "Amazon", "Meta"], "Average hides outliers; p99 tail latency governs user experience at scale."],
    ["Vertical vs Horizontal Scaling & Stateless Services", "sd-vertical-vs-horizontal-scaling", "Scaling Foundations", "MUST_KNOW", ["Amazon", "Meta", "Uber"], "Stateless app tiers scale horizontally behind load balancers by moving state to Redis/DB."],
    ["Back-of-the-Envelope Estimation (QPS, Storage, Bandwidth)", "sd-capacity-estimation", "Core Metrics", "MUST_KNOW", ["Google", "Meta", "Amazon"], "1M DAU ~ 12–30 QPS avg, 2–3x peak; 10^5 sec/day simplifies mental math."],
    ["Caching Strategies: Cache-Aside, Write-Through, Write-Back & Eviction (LRU/LFU)", "sd-caching-strategies-eviction", "Caching", "MUST_KNOW", ["Amazon", "Meta", "Netflix"], "Cache-Aside loads lazily on miss; handle thundering herd, stampede, and TTL jitter."],
    ["Database Replication (Leader-Follower, Multi-Leader) & Replication Lag", "sd-db-replication-lag", "Data Scaling", "MUST_KNOW", ["Amazon", "Meta", "Uber"], "Read-your-own-writes and monotonic reads mitigate async follower lag."],
    ["Database Sharding / Partitioning & Hotspot Mitigation", "sd-db-sharding-hotspots", "Data Scaling", "MUST_KNOW", ["Meta", "Amazon", "Twitter"], "Range vs Hash sharding; celebrity hotspots need salted keys or dedicated shards."],
    ["Consistent Hashing & Virtual Nodes", "sd-consistent-hashing", "Distributed Systems", "MUST_KNOW", ["Amazon", "Discord", "Uber"], "Maps nodes & keys onto a 0..2^32 ring so node changes remap only K/N keys."],
    ["CAP Theorem & PACELC Theorem", "sd-cap-pacelc-theorem", "Distributed Systems", "MUST_KNOW", ["Amazon", "Google", "Meta"], "Under partition (P), choose CP (strong consistency) or AP (high availability); else latency vs consistency."],
    ["Distributed Consensus (Raft / Paxos) & Leader Election", "sd-consensus-raft-paxos", "Distributed Systems", "ADVANCED", ["Google", "Databricks", "Amazon"], "Quorum majority commits replicated logs cleanly across crashes (etcd, ZooKeeper)."],
    ["Rate Limiting Algorithms (Token Bucket, Leaky Bucket, Sliding Window)", "sd-rate-limiting-algorithms", "Reliability", "MUST_KNOW", ["Stripe", "Amazon", "Cloudflare"], "Token Bucket allows bursts; Sliding Window Log/Counter avoids boundary spikes."],
    ["Message Queues & Event Streaming (Kafka vs RabbitMQ)", "sd-message-queues-kafka", "Async Architecture", "MUST_KNOW", ["Uber", "LinkedIn", "Amazon"], "Decouple spikes asynchronously; Kafka partitions retain ordered logs for consumer groups."],
    ["Idempotency Keys & Exactly-Once vs At-Least-Once Delivery", "sd-idempotency-delivery-semantics", "Reliability", "MUST_KNOW", ["Stripe", "Uber", "Amazon"], "Store client-generated idempotency keys in DB/Redis so retries never double-charge."],
    ["Circuit Breaker, Retries with Exponential Backoff & Jitter", "sd-circuit-breaker-backoff", "Reliability", "IMPORTANT", ["Netflix", "Amazon", "Stripe"], "Stop cascading failures by tripping open on errors and adding jitter to avoid retry storms."],
    ["API Gateway vs BFF & Service Discovery", "sd-api-gateway-service-discovery", "Microservices", "IMPORTANT", ["Netflix", "Amazon", "Uber"], "Centralizes auth, TLS, rate limiting, and routing in front of internal microservices."],
    ["Monolith vs Microservices & Saga Pattern (Distributed Tx)", "sd-monolith-microservices-saga", "Microservices", "IMPORTANT", ["Uber", "Amazon", "Stripe"], "Replace 2PC with Saga compensating transactions across independent service DBs."],
    ["Distributed ID Generation (UUID vs Twitter Snowflake)", "sd-snowflake-unique-id", "Building Blocks", "IMPORTANT", ["Twitter", "Discord", "Instagram"], "64-bit Snowflake: 41-bit timestamp + 10-bit worker + 12-bit sequence yields time-ordered IDs."],
    ["Bloom Filters & HyperLogLog", "sd-bloom-filters-hll", "Building Blocks", "ADVANCED", ["Google", "Meta", "Cloudflare"], "Probabilistic O(1) membership (no false negatives) and cardinality estimation in KB of RAM."],
    ["LLD: Design Parking Lot / Elevator System", "sd-lld-parking-lot-elevator", "Low-Level Design", "MUST_KNOW", ["Amazon", "Microsoft", "Uber"], "Apply Strategy for pricing/dispatch, Factory for spots, and clean OOP state machines."],
    ["LLD: Design LRU / LFU Cache & Rate Limiter", "sd-lld-lru-rate-limiter", "Low-Level Design", "MUST_KNOW", ["Amazon", "Google", "Meta"], "Combine HashMap + Doubly Linked List for O(1) LRU; thread-safe locks for concurrency."],
    ["LLD: Design Splitwise / BookMyShow (Concurrency & Locking)", "sd-lld-splitwise-bookmyshow", "Low-Level Design", "IMPORTANT", ["Flipkart", "Amazon", "Swiggy"], "Prevent double seat booking via optimistic version checks or distributed Redis locks."],
    ["HLD: Design URL Shortener (TinyURL)", "sd-hld-url-shortener", "High-Level Design", "MUST_KNOW", ["Amazon", "Google", "Meta"], "Base-62 encoding of Snowflake/KGS IDs + 301/302 redirects + Redis read cache."],
    ["HLD: Design Notification System & Web Crawler", "sd-hld-notification-crawler", "High-Level Design", "IMPORTANT", ["Amazon", "Google", "Uber"], "Priority queues + retry workers + user preference/rate-limit filtering + deduplication."],
    ["HLD: Design Real-Time Chat System (WhatsApp / Discord)", "sd-hld-chat-system", "High-Level Design", "MUST_KNOW", ["Meta", "Discord", "Amazon"], "Persistent WebSockets + presence heartbeats + Cassandra/Dynamo message partitioning."],
    ["HLD: Design News Feed / Video Streaming (Instagram / YouTube)", "sd-hld-news-feed-video", "High-Level Design", "IMPORTANT", ["Meta", "Netflix", "Google"], "Hybrid Fan-out on Write (normal users) + Fan-out on Read (celebrities) + CDN HLS segments."],
    ["WebSockets, Pub/Sub & Server-Side Push at Scale", "sd-websockets-pubsub-scale", "Real-Time Architecture", "IMPORTANT", ["Discord", "Uber", "Meta"], "Stateful gateway servers maintain WS connections and subscribe to Redis/Kafka pub-sub channels."],
    ["Distributed Caching, Cache Stampede & Singleflight", "sd-cache-stampede-singleflight", "Caching", "IMPORTANT", ["Meta", "Netflix", "Cloudflare"], "Coalesce concurrent cache misses with singleflight/locks and stagger TTLs with jitter."],
  ]),
];

const subjectCounters = new Map<CsSubject, number>();

export const CS_FUNDAMENTALS_TOPICS: CsFundamentalItem[] = RAW_TOPICS.map(
  (item) => {
    const nextOrder = (subjectCounters.get(item.subject) ?? 0) + 1;
    subjectCounters.set(item.subject, nextOrder);
    return {
      order: nextOrder,
      ...item,
    };
  }
);
