import { z } from "zod";

export const CS_SUBJECTS = [
  "Operating Systems",
  "DBMS",
  "SQL & Query Patterns",
  "Computer Networks",
  "OOP & Software Engineering",
  "System Design",
  "Behavioral & HR",
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

export type CsVisualType = "CODE" | "DIAGRAM" | "STAR";

export interface CsStarFramework {
  situation: string;
  task: string;
  action: string;
  result: string;
}

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
  whatInterviewerTests?: string;
  starFramework?: CsStarFramework;
  sampleSpokenAnswer?: string;
  avoidMistakes?: string[];
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
    ["OS Kernel vs User Mode & System Calls", "os-kernel-user-mode-syscalls", "OS Architecture", "MUST_KNOW", ["Microsoft", "Amazon", "Google"], "Keeps hardware safe: normal apps run in user mode and ask the OS kernel for help via system calls."],
    ["Process vs Thread & PCB vs TCB", "os-process-vs-thread", "Processes & Threads", "MUST_KNOW", ["Amazon", "Microsoft", "Meta"], "A process is a separate program with its own memory; threads are workers inside it that share memory."],
    ["Process States & Lifecycle (5/7-State Model)", "os-process-states-lifecycle", "Processes & Threads", "MUST_KNOW", ["Amazon", "Oracle"], "Shows how a program moves from New, Ready, and Running to Waiting, Suspended, and Finished."],
    ["Context Switching & Mode Switching", "os-context-switching", "Processes & Threads", "MUST_KNOW", ["Google", "Microsoft"], "Saves one program's current state (registers and memory map) so the CPU can switch to another."],
    ["Multithreading Models (1:1, N:1, M:N)", "os-multithreading-models", "Processes & Threads", "IMPORTANT", ["Google", "Meta"], "How app threads map to OS kernel threads, balancing speed with system-call cost."],
    ["Inter-Process Communication (IPC): Pipes, Shared Memory & Sockets", "os-ipc-mechanisms", "Processes & Threads", "MUST_KNOW", ["Amazon", "Microsoft", "Cisco"], "Ways for separate programs to talk: shared memory is fastest; pipes and sockets send messages safely."],
    ["Fork(), Exec() & Zombie vs Orphan Processes", "os-fork-exec-zombie-orphan", "Processes & Threads", "IMPORTANT", ["Amazon", "Oracle", "Qualcomm"], "A zombie process finished but its parent hasn't checked it yet; an orphan lost its parent and gets adopted by PID 1."],
    ["CPU Scheduling Criteria & Preemptive vs Non-Preemptive", "os-cpu-scheduling-criteria", "CPU Scheduling", "MUST_KNOW", ["Amazon", "Microsoft"], "Decides which task gets the CPU next to keep wait times low, throughput high, and every app responsive."],
    ["FCFS, SJF & SRTF Scheduling", "os-fcfs-sjf-srtf", "CPU Scheduling", "MUST_KNOW", ["Amazon", "Flipkart"], "Shortest-job-first cuts average wait time, but long tasks can get stuck waiting forever."],
    ["Round Robin & Time Quantum Trade-offs", "os-round-robin-quantum", "CPU Scheduling", "MUST_KNOW", ["Microsoft", "Adobe"], "Gives each task a fixed time slice: too short wastes time switching; too long feels slow like FCFS."],
    ["Priority Scheduling, Aging & Multi-Level Feedback Queue", "os-priority-mlfq", "CPU Scheduling", "IMPORTANT", ["Google", "Microsoft"], "Aging slowly boosts waiting tasks so they don't starve; MLFQ keeps interactive apps snappy."],
    ["Sharing Data Safely Between Threads (Critical Section & Race Condition)", "os-critical-section-race-condition", "Synchronization", "MUST_KNOW", ["Amazon", "Meta", "Microsoft"], "Prevents two threads from corrupting shared data at once using Mutual Exclusion, Progress, and Bounded Waiting."],
    ["Mutex vs Binary Semaphore vs Counting Semaphore", "os-mutex-vs-semaphore", "Synchronization", "MUST_KNOW", ["Amazon", "Microsoft", "Qualcomm"], "A mutex is a lock owned by one thread; a semaphore is a counter that signals when resources are free."],
    ["Monitors & Condition Variables", "os-monitors-condition-variables", "Synchronization", "IMPORTANT", ["Google", "Meta"], "Bundles shared data, a lock, and wait/notify queues together (like Java's synchronized blocks)."],
    ["Classic Sync Problems: Producer-Consumer, Readers-Writers, Dining Philosophers", "os-classic-sync-problems", "Synchronization", "MUST_KNOW", ["Amazon", "Microsoft", "Oracle"], "Must-know patterns for safe queues, reader/writer fairness, and avoiding circular deadlocks."],
    ["4 Conditions That Cause Deadlock (Coffman's Conditions)", "os-deadlock-coffman-conditions", "Deadlocks", "MUST_KNOW", ["Amazon", "Google", "Microsoft"], "Deadlock happens only when Mutual Exclusion, Hold & Wait, No Preemption, and Circular Wait all occur together."],
    ["Deadlock Prevention, Avoidance (Banker's Algorithm) & Detection", "os-deadlock-prevention-bankers", "Deadlocks", "IMPORTANT", ["Amazon", "Oracle"], "Stop deadlocks by breaking one of the 4 conditions, or check safe resource order with Banker's Algorithm."],
    ["Livelock vs Starvation vs Deadlock", "os-livelock-starvation-deadlock", "Deadlocks", "IMPORTANT", ["Microsoft", "Adobe"], "Deadlock = stuck forever; livelock = busy retrying with no progress; starvation = kept waiting unfairly."],
    ["Logical vs Physical Memory Addresses & MMU", "os-logical-physical-address-mmu", "Memory Management", "MUST_KNOW", ["Qualcomm", "Microsoft"], "Programs use virtual addresses, and the MMU hardware translates them into real RAM locations."],
    ["Contiguous Allocation: Internal vs External Fragmentation", "os-fragmentation-allocation", "Memory Management", "MUST_KNOW", ["Amazon", "Oracle"], "Fixed memory blocks waste space inside blocks (internal); variable blocks leave small unusable gaps (external)."],
    ["Paging, Page Table & Multi-Level Page Tables", "os-paging-multilevel-tables", "Virtual Memory", "MUST_KNOW", ["Google", "Microsoft", "Amazon"], "Splits memory into equal-size pages to avoid gaps, using multi-level tables to save RAM."],
    ["TLB (Fast Page Cache) & Effective Access Time", "os-tlb-effective-access-time", "Virtual Memory", "MUST_KNOW", ["Google", "Qualcomm", "Nvidia"], "A tiny hardware cache for recent page translations so the CPU doesn't have to look up RAM twice."],
    ["Segmentation vs Paging & Segmented Paging", "os-segmentation-vs-paging", "Virtual Memory", "IMPORTANT", ["Microsoft", "Cisco"], "Segmentation groups memory by code/data sections; paging splits it into fixed frames for easy RAM allocation."],
    ["Virtual Memory, Demand Paging & Page Fault Handling", "os-virtual-memory-demand-paging", "Virtual Memory", "MUST_KNOW", ["Amazon", "Google", "Microsoft"], "Loads program pages from disk into RAM only when needed, triggered by a page fault."],
    ["Page Replacement Algorithms (FIFO, Optimal, LRU, Clock) & Belady's Anomaly", "os-page-replacement-belady", "Virtual Memory", "MUST_KNOW", ["Amazon", "Microsoft"], "Chooses which page to evict when RAM is full; LRU is practical, while FIFO can weirdly cause more faults with more RAM."],
    ["Thrashing & Working Set Model", "os-thrashing-working-set", "Virtual Memory", "IMPORTANT", ["Google", "Amazon"], "Happens when programs need more RAM than available, so the OS spends all its time swapping pages instead of running code."],
    ["File Systems, Inodes, Hard Links vs Soft Links", "os-file-systems-inodes-links", "File Systems & I/O", "IMPORTANT", ["Meta", "Amazon", "Google"], "An inode holds file details and disk pointers; a hard link points to the same inode, while a symlink is a shortcut path."],
    ["Boot Process, BIOS/UEFI & OS Initialization", "os-boot-process-bios-uefi", "OS Architecture", "IMPORTANT", ["Microsoft", "Qualcomm"], "Step-by-step power-on flow: hardware check -> BIOS/UEFI -> bootloader -> OS kernel -> first user process."],
    ["I/O Polling, Interrupts & DMA (Direct Memory Access)", "os-io-polling-interrupts-dma", "File Systems & I/O", "IMPORTANT", ["Qualcomm", "Nvidia", "Amazon"], "DMA lets devices copy large data directly into RAM and ping the CPU only when finished."],
    ["Disk Scheduling (FCFS, SSTF, SCAN, C-SCAN) & RAID Levels", "os-disk-scheduling-raid", "File Systems & I/O", "ADVANCED", ["Oracle", "Dell", "Amazon"], "Orders disk reads to reduce head movement, and uses RAID (0/1/5/10) for speed or backup protection."],
  ]),

  // ── 2. DBMS (26) ──────────────────────────────────────────────────────────
  ...buildSubject("DBMS", [
    ["3-Layer Database Architecture & Data Independence", "dbms-three-schema-architecture", "Foundations", "IMPORTANT", ["Oracle", "Amazon"], "Separates what users see (External), table design (Conceptual), and disk storage (Internal) so changes don't break apps."],
    ["ER Diagrams: Weak Entities, Relationships & Generalization", "dbms-er-model-cardinality", "Data Modeling", "MUST_KNOW", ["Amazon", "Flipkart"], "Weak entities depend on a parent record's key; ER diagrams map directly into database tables."],
    ["Database Keys: Super, Candidate, Primary, Alternate & Foreign Key", "dbms-keys-taxonomy", "Relational Model", "MUST_KNOW", ["Amazon", "Microsoft", "Goldman Sachs"], "Candidate keys are minimal unique IDs; foreign keys link tables safely together."],
    ["Referential Integrity & ON DELETE CASCADE / SET NULL", "dbms-referential-integrity", "Relational Model", "MUST_KNOW", ["Amazon", "Oracle"], "Stops broken links when deleting parent rows using RESTRICT, CASCADE, SET NULL, or SET DEFAULT."],
    ["Relational Algebra: Select, Project, Join & Division", "dbms-relational-algebra", "Relational Model", "IMPORTANT", ["Oracle", "Microsoft"], "The math operations behind how SQL databases plan and optimize queries."],
    ["Functional Dependencies & Attribute Closure", "dbms-functional-dependencies", "Normalization", "MUST_KNOW", ["Amazon", "Oracle"], "X -> Y means X uniquely determines Y; helps you find candidate keys and clean up messy tables."],
    ["Database Normalization: 1NF, 2NF, 3NF & BCNF", "dbms-normalization-1nf-bcnf", "Normalization", "MUST_KNOW", ["Amazon", "Microsoft", "Flipkart"], "Removes duplicate data and update bugs step-by-step from 1NF through BCNF."],
    ["Lossless-Join vs Dependency-Preserving Table Splits", "dbms-lossless-dependency-preserving", "Normalization", "IMPORTANT", ["Oracle", "Amazon"], "3NF keeps both data and rules intact; BCNF guarantees no lost data but may split some rules."],
    ["Denormalization Trade-offs (Fast Reads vs Clean Writes)", "dbms-denormalization-oltp-olap", "Normalization", "IMPORTANT", ["Amazon", "Uber", "Meta"], "Intentionally repeats some columns to skip slow multi-table joins on read-heavy pages."],
    ["Transactions & ACID Properties", "dbms-transactions-acid", "Transactions", "MUST_KNOW", ["Amazon", "Google", "Goldman Sachs"], "Atomicity, Consistency, Isolation, and Durability keep bank transfers and updates safe from crashes."],
    ["BASE vs ACID & Eventual Consistency", "dbms-acid-vs-base", "Transactions", "IMPORTANT", ["Amazon", "Uber"], "Distributed NoSQL databases trade strict instant consistency for high uptime across servers."],
    ["Serializability: Conflict vs View Serializability", "dbms-serializability-conflict-view", "Concurrency Control", "MUST_KNOW", ["Oracle", "Amazon"], "Checks if overlapping transactions produce the same safe result as running one after another."],
    ["Concurrency Bugs: Dirty Read, Non-Repeatable Read & Phantom Read", "dbms-concurrency-anomalies", "Concurrency Control", "MUST_KNOW", ["Amazon", "Microsoft", "Uber"], "Happens when one transaction sees another's unsaved changes, mid-flight edits, or newly added rows."],
    ["SQL Isolation Levels (Read Uncommitted to Serializable)", "dbms-sql-isolation-levels", "Concurrency Control", "MUST_KNOW", ["Amazon", "Meta", "Uber"], "Controls how much transactions can see each other; higher isolation prevents bugs but adds locking."],
    ["Two-Phase Locking (2PL), Strict 2PL & Deadlocks", "dbms-two-phase-locking", "Concurrency Control", "MUST_KNOW", ["Oracle", "Amazon"], "Acquire locks first, release later; Strict 2PL holds write locks until commit to stay safe."],
    ["Optimistic vs Pessimistic Locking", "dbms-occ-vs-pessimistic-locking", "Concurrency Control", "IMPORTANT", ["Amazon", "Stripe", "Uber"], "Pessimistic locks rows upfront; optimistic checks a version number at save time when conflicts are rare."],
    ["Timestamp Ordering & Thomas Write Rule", "dbms-timestamp-ordering-protocol", "Concurrency Control", "IMPORTANT", ["Oracle", "Amazon"], "Orders reads and writes by start time; Thomas Write safely skips outdated writes."],
    ["Database Deadlock Prevention (Wait-Die, Wound-Wait) & Detection", "dbms-deadlock-wait-die-wound-wait", "Concurrency Control", "IMPORTANT", ["Oracle", "Microsoft", "Amazon"], "Wait-Die lets older transactions wait; Wound-Wait aborts newer ones to break circular waits."],
    ["How MVCC (Multi-Version Concurrency Control) Works", "dbms-mvcc-internals", "Concurrency Control", "ADVANCED", ["Google", "Meta", "Databricks"], "Keeps row snapshots so readers never block writers and writers never block readers."],
    ["Database Indexing: B-Tree vs B+ Tree", "dbms-btree-vs-bplus-tree", "Indexing & Storage", "MUST_KNOW", ["Amazon", "Google", "Microsoft"], "B+ Trees keep data pointers in linked leaf nodes, making range queries and lookups super fast."],
    ["Clustered vs Non-Clustered (Secondary) Indexes", "dbms-clustered-vs-non-clustered-index", "Indexing & Storage", "MUST_KNOW", ["Amazon", "Microsoft", "Flipkart"], "Clustered sorts the actual table rows (1 per table); secondary indexes point back to the primary key."],
    ["Composite Indexes & Leftmost Prefix Rule", "dbms-composite-index-leftmost-prefix", "Indexing & Storage", "MUST_KNOW", ["Amazon", "Uber", "Meta"], "An index on (a, b, c) speeds up queries on (a), (a, b), and (a, b, c), but not (b, c) alone."],
    ["Covering Index & Hash Index Limitations", "dbms-covering-hash-index", "Indexing & Storage", "IMPORTANT", ["Meta", "Amazon"], "A covering index answers a query without touching the table; hash indexes can't handle range (<, >) searches."],
    ["Write-Ahead Logging (WAL), Checkpoints & Crash Recovery", "dbms-wal-checkpoints-aries", "Recovery & Internals", "ADVANCED", ["Google", "Databricks", "Oracle"], "Writes changes to a log file first so the database can replay or undo work after a sudden crash."],
    ["How SQL Queries Run & EXPLAIN / ANALYZE", "dbms-query-execution-explain", "Query Optimization", "MUST_KNOW", ["Amazon", "Uber", "Meta"], "Parser -> Optimizer (picks full scan vs index scan) -> Executor; EXPLAIN shows where queries are slow."],
    ["Database Connection Pooling (PgBouncer / HikariCP)", "dbms-connection-pooling", "Operations", "IMPORTANT", ["Uber", "Stripe", "Amazon"], "Reuses open database connections instead of opening a slow new one for every API request."],
    ["SQL vs NoSQL (Document, Key-Value, Columnar, Graph)", "dbms-sql-vs-nosql-models", "Data Models", "MUST_KNOW", ["Amazon", "Meta", "Google"], "Use SQL for strict rules and joins; use NoSQL for flexible schemas or massive write traffic."],
    ["Read Replicas, Write Overhead & Vacuuming", "dbms-replicas-vacuum-bloat", "Operations", "ADVANCED", ["Meta", "Uber"], "Replicas scale read traffic; autovacuum cleans old MVCC row versions; too many indexes slow down writes."],
  ]),

  // ── 3. SQL & Query Patterns (28) ──────────────────────────────────────────
  ...buildSubject("SQL & Query Patterns", [
    ["SQL Command Types: DDL, DML, DCL & TCL", "sql-ddl-dml-dcl-tcl", "SQL Foundations", "MUST_KNOW", ["Amazon", "Oracle", "Microsoft"], "Groups table setup (CREATE/ALTER), data edits (SELECT/INSERT), permissions (GRANT), and transactions (COMMIT)."],
    ["DELETE vs TRUNCATE vs DROP", "sql-delete-vs-truncate-vs-drop", "SQL Foundations", "MUST_KNOW", ["Amazon", "Oracle", "Flipkart"], "DELETE removes rows one by one (can undo); TRUNCATE clears all rows fast; DROP deletes the whole table."],
    ["SQL Execution Order (FROM -> WHERE -> GROUP BY -> HAVING -> SELECT -> ORDER BY)", "sql-logical-execution-order", "SQL Foundations", "MUST_KNOW", ["Amazon", "Meta", "Google"], "Explains why column nicknames (aliases) made in SELECT can't be used in WHERE."],
    ["SQL Joins: INNER, LEFT, RIGHT, FULL OUTER & CROSS JOIN", "sql-joins-taxonomy", "Joins", "MUST_KNOW", ["Amazon", "Microsoft", "Flipkart"], "Shows how tables combine, how NULLs appear for missing matches, and why duplicate keys multiply rows."],
    ["SELF JOIN Patterns (Employee-Manager & Consecutive Rows)", "sql-self-join-patterns", "Joins", "MUST_KNOW", ["Amazon", "Meta", "Oracle"], "Joins a table to itself with two aliases to compare rows inside the same table."],
    ["Finding Missing Rows: LEFT JOIN ... IS NULL vs NOT EXISTS vs NOT IN", "sql-anti-join-null-pitfall", "Joins", "MUST_KNOW", ["Amazon", "Meta"], "NOT IN breaks and returns 0 rows if any NULL exists; use NOT EXISTS or LEFT JOIN ... IS NULL instead."],
    ["Working with NULLs: COALESCE, NULLIF & Three-Valued Logic", "sql-null-three-valued-logic", "SQL Foundations", "MUST_KNOW", ["Amazon", "Google"], "In SQL, NULL = NULL is unknown, not true; always use IS NULL, COALESCE, and know COUNT(*) vs COUNT(col)."],
    ["GROUP BY, HAVING vs WHERE & Aggregate Functions", "sql-group-by-having-where", "Aggregations", "MUST_KNOW", ["Amazon", "Microsoft"], "WHERE filters rows before grouping; HAVING filters grouped totals after GROUP BY."],
    ["Conditional Counting & Pivoting (SUM(CASE WHEN ...))", "sql-conditional-aggregation-pivot", "Aggregations", "MUST_KNOW", ["Meta", "Uber", "Amazon"], "Calculates multiple filtered counts or sums in a single table scan without extra joins."],
    ["UNION vs UNION ALL & Set Operations (INTERSECT, EXCEPT)", "sql-union-vs-union-all", "Set Operations", "MUST_KNOW", ["Amazon", "Oracle"], "UNION removes duplicates (slower); UNION ALL keeps all rows fast when duplicates don't matter."],
    ["Subqueries & EXISTS (Correlated vs Uncorrelated)", "sql-subqueries-correlated-exists", "Subqueries & CTEs", "MUST_KNOW", ["Amazon", "Microsoft"], "EXISTS stops as soon as it finds one match, making it fast for checking if related rows exist."],
    ["CTEs (WITH Clause) for Clean Multi-Step Queries", "sql-ctes-with-clause", "Subqueries & CTEs", "MUST_KNOW", ["Meta", "Amazon", "Google"], "Breaks messy nested queries into readable named steps using WITH."],
    ["Recursive CTEs (Org Charts, Hierarchies & Tree Paths)", "sql-recursive-ctes", "Subqueries & CTEs", "ADVANCED", ["Google", "Meta", "Uber"], "Starts with a root row and loops with UNION ALL until it walks the whole tree."],
    ["Window Functions Basics: OVER (PARTITION BY ... ORDER BY ...)", "sql-window-functions-intro", "Window Functions", "MUST_KNOW", ["Amazon", "Meta", "Google"], "Calculates ranks or running totals across related rows without collapsing them like GROUP BY."],
    ["ROW_NUMBER() vs RANK() vs DENSE_RANK()", "sql-row-number-rank-dense-rank", "Window Functions", "MUST_KNOW", ["Amazon", "Meta", "Flipkart"], "Compares tie handling: 1,2,3,4 vs 1,2,2,4 (skips 3) vs 1,2,2,3 (no gaps)."],
    ["Nth Highest Salary & Top-K Per Group Pattern", "sql-nth-highest-salary-top-k", "Interview Patterns", "MUST_KNOW", ["Amazon", "Microsoft", "Google"], "Use DENSE_RANK() OVER (PARTITION BY dept ORDER BY salary DESC) <= K to get top earners per team."],
    ["LEAD() and LAG() for Comparing Previous & Next Rows", "sql-lead-lag-time-series", "Window Functions", "MUST_KNOW", ["Meta", "Uber", "Amazon"], "Reads the previous or next row's value directly without writing a slow self-join."],
    ["Running Totals & Moving Averages (ROWS vs RANGE)", "sql-running-totals-frames", "Window Functions", "IMPORTANT", ["Amazon", "Goldman Sachs"], "Use ROWS BETWEEN 6 PRECEDING AND CURRENT ROW for exact 7-row rolling averages."],
    ["Removing Duplicate Rows (ROW_NUMBER() = 1)", "sql-deduplication-pattern", "Interview Patterns", "MUST_KNOW", ["Amazon", "Meta"], "Group by the unique key, sort by newest timestamp, and keep only row number 1."],
    ["Gaps and Islands (Finding Consecutive Dates or Streaks)", "sql-gaps-and-islands", "Interview Patterns", "ADVANCED", ["Meta", "Google", "Uber"], "Subtract ROW_NUMBER() from dates or IDs so consecutive streaks share the same group value."],
    ["Median & Percentile Queries (PERCENTILE_CONT / NTILE)", "sql-median-percentile-ntile", "Window Functions", "IMPORTANT", ["Meta", "Uber"], "Use PERCENTILE_CONT(0.5) or split rows into equal buckets with NTILE."],
    ["User Retention, Funnel & Cohort Queries", "sql-retention-cohort-funnel", "Interview Patterns", "IMPORTANT", ["Meta", "Amazon", "Swiggy"], "Track Day-1/Day-7 return rates by comparing each user's first login date with later logins."],
    ["Finding Overlapping Date Ranges in SQL", "sql-date-intervals-overlap", "Interview Patterns", "IMPORTANT", ["Uber", "Airbnb", "Amazon"], "Two bookings [start1, end1] and [start2, end2] overlap whenever start1 <= end2 AND start2 <= end1."],
    ["Views vs Materialized Views", "sql-views-vs-materialized-views", "Schema & Objects", "IMPORTANT", ["Oracle", "Amazon"], "Regular views run a saved query live; materialized views save the query results on disk for speed."],
    ["Stored Procedures, Triggers & Custom Functions", "sql-procedures-triggers-udf", "Schema & Objects", "IMPORTANT", ["Oracle", "Microsoft"], "Run reusable logic inside the database, but watch out for hidden trigger chains and locks."],
    ["Preventing SQL Injection with Parameterized Queries", "sql-injection-prepared-statements", "Security", "MUST_KNOW", ["Amazon", "Google", "Meta"], "Always pass user input as bound parameters—never glue raw user strings into SQL text."],
    ["Writing Fast Index-Friendly Queries (SARGable WHERE)", "sql-sargable-query-optimization", "Query Optimization", "IMPORTANT", ["Amazon", "Uber", "Meta"], "Don't wrap indexed columns in functions like YEAR(date) or start LIKE with '%abc', or indexes won't work."],
    ["Cursor (Keyset) Pagination vs OFFSET Pagination", "sql-keyset-vs-offset-pagination", "Query Optimization", "IMPORTANT", ["Meta", "Uber", "Stripe"], "OFFSET gets slow on deep pages; filtering by WHERE (created_at, id) < (...) stays fast at any scale."],
  ]),

  // ── 4. Computer Networks (26) ─────────────────────────────────────────────
  ...buildSubject("Computer Networks", [
    ["OSI 7-Layer Model vs TCP/IP Model", "cn-osi-vs-tcpip-model", "Network Models", "MUST_KNOW", ["Cisco", "Amazon", "Microsoft"], "Explains the 7 network layers from cables (Physical) up to web apps (Application) and how data travels."],
    ["Data Packaging (Encapsulation) & Hub vs Switch vs Router", "cn-encapsulation-switch-router", "Network Models", "MUST_KNOW", ["Cisco", "Amazon"], "Switches forward local frames by MAC address; routers connect networks using IP addresses."],
    ["IPv4 vs IPv6, Private IP Ranges & Loopback", "cn-ipv4-ipv6-private-ranges", "Network Layer", "MUST_KNOW", ["Cisco", "Amazon", "Google"], "Covers private Wi-Fi/LAN IP blocks (10.x, 172.16.x, 192.168.x), localhost (127.0.0.1), and 128-bit IPv6."],
    ["Subnetting, CIDR Notation & Subnet Masks", "cn-subnetting-cidr", "Network Layer", "MUST_KNOW", ["Cisco", "Amazon", "Cloudflare"], "/N sets N network bits and (32 - N) host bits; usable devices = 2^(32 - N) - 2."],
    ["ARP (Finding a Device's MAC Address from Its IP)", "cn-arp-protocol", "Link & Network Layer", "IMPORTANT", ["Cisco", "Qualcomm"], "Asks the local network 'who has this IP?' so a device can learn the target MAC address."],
    ["DHCP (How Devices Automatically Get an IP Address)", "cn-dhcp-dora", "Network Layer", "IMPORTANT", ["Cisco", "Microsoft"], "4-step DORA handshake (Discover, Offer, Request, Ack) that assigns IP, gateway, and DNS."],
    ["NAT & Port Forwarding (Sharing One Public IP)", "cn-nat-and-pat", "Network Layer", "MUST_KNOW", ["Cisco", "Amazon", "Cloudflare"], "Lets many home or office devices share one public IP by tracking different port numbers."],
    ["ICMP, Ping & How Traceroute Works", "cn-icmp-ping-traceroute", "Network Layer", "IMPORTANT", ["Google", "Cloudflare"], "Ping tests reachability; Traceroute increases IP TTL step-by-step to map every router hop."],
    ["Routing Protocols: RIP vs OSPF vs BGP", "cn-routing-protocols-rip-ospf-bgp", "Network Layer", "IMPORTANT", ["Cisco", "Cloudflare", "Amazon"], "RIP counts hops, OSPF finds fastest local paths, and BGP routes traffic across the global internet."],
    ["Email & Remote Access: SMTP, POP3, IMAP, FTP & SSH", "cn-email-ftp-ssh-protocols", "Application Layer", "IMPORTANT", ["Cisco", "Microsoft"], "SMTP sends email, IMAP syncs inbox folders, and SSH gives encrypted terminal access on port 22."],
    ["TCP vs UDP: Reliable Streams vs Fast Packets", "cn-tcp-vs-udp", "Transport Layer", "MUST_KNOW", ["Amazon", "Google", "Meta"], "TCP guarantees every byte arrives in order; UDP skips checks for fast video calls, gaming, and DNS."],
    ["TCP 3-Way Handshake (SYN, SYN-ACK, ACK) & SYN Floods", "cn-tcp-3-way-handshake", "Transport Layer", "MUST_KNOW", ["Amazon", "Google", "Cloudflare"], "Opens a reliable connection by syncing sequence numbers; SYN cookies defend against flood attacks."],
    ["TCP 4-Way Connection Close & TIME_WAIT", "cn-tcp-4-way-teardown-time-wait", "Transport Layer", "IMPORTANT", ["Google", "Meta", "Uber"], "Safely closes both sides of a connection; TIME_WAIT prevents late stray packets from mixing into new connections."],
    ["TCP Flow Control (Sliding Window) vs Congestion Control", "cn-tcp-flow-vs-congestion-control", "Transport Layer", "MUST_KNOW", ["Google", "Amazon", "Cisco"], "Flow control stops overwhelming the receiver; congestion control slows down when the network gets crowded."],
    ["TCP Error Control: Checksums & Fast Retransmit", "cn-tcp-error-control-retransmit", "Transport Layer", "IMPORTANT", ["Cisco", "Amazon"], "Resends lost packets automatically; 3 duplicate ACKs trigger an instant resend without waiting for a timeout."],
    ["Network Socket Lifecycle (socket, bind, listen, accept, connect)", "cn-socket-lifecycle", "Transport Layer", "IMPORTANT", ["Microsoft", "Amazon", "Uber"], "The OS steps a server and client use to open ports, accept connections, and exchange data."],
    ["DNS Lookup Flow (How Domain Names Become IP Addresses)", "cn-dns-resolution-flow", "Application Layer", "MUST_KNOW", ["Google", "Amazon", "Cloudflare"], "Walks from Browser Cache -> Recursive Resolver -> Root -> TLD -> Authoritative server, cached by TTL."],
    ["HTTP Methods, Idempotency & Status Codes (2xx, 3xx, 4xx, 5xx)", "cn-http-methods-status-codes", "Application Layer", "MUST_KNOW", ["Amazon", "Stripe", "Meta"], "GET/PUT/DELETE can be safely retried (idempotent); POST cannot; know 401 vs 403, 429, and 502 vs 504."],
    ["HTTP/1.1 vs HTTP/2 vs HTTP/3 (QUIC)", "cn-http1-http2-http3-quic", "Application Layer", "MUST_KNOW", ["Google", "Cloudflare", "Meta"], "HTTP/2 sends multiple requests over one TCP link; HTTP/3 uses UDP/QUIC to avoid packet-loss stalls."],
    ["HTTPS, Encryption & TLS 1.3 Handshake", "cn-https-tls-handshake", "Security", "MUST_KNOW", ["Google", "Amazon", "Stripe"], "Uses certificates to verify the server and swap keys, then encrypts data with fast symmetric AES/ChaCha."],
    ["Cookies vs Sessions vs JWT & CORS", "cn-cookies-jwt-cors", "Web & Security", "MUST_KNOW", ["Amazon", "Meta", "Stripe"], "How login state works on the web, and how CORS headers control which websites can call your API."],
    ["WebSockets vs Long Polling vs Server-Sent Events (SSE)", "cn-websockets-sse-polling", "Real-Time Protocols", "MUST_KNOW", ["Meta", "Uber", "Slack"], "WebSockets allow two-way live chat; SSE streams one-way updates from server to browser over HTTP."],
    ["Forward Proxy vs Reverse Proxy", "cn-forward-vs-reverse-proxy", "Infrastructure", "MUST_KNOW", ["Amazon", "Cloudflare", "Nginx"], "A forward proxy acts on behalf of users; a reverse proxy sits in front of backend servers (like Nginx)."],
    ["Load Balancing: L4 vs L7 & Traffic Routing", "cn-load-balancers-l4-l7", "Infrastructure", "MUST_KNOW", ["Amazon", "Google", "Uber"], "L4 routes by IP and port; L7 inspects URLs and headers to spread traffic evenly across servers."],
    ["CDN (Content Delivery Network) & Edge Caching", "cn-cdn-edge-caching", "Infrastructure", "IMPORTANT", ["Netflix", "Cloudflare", "Meta"], "Stores images and videos on servers close to users worldwide, cutting load times and origin server traffic."],
    ["Firewalls, WAF, DDoS Protection & VPNs", "cn-firewalls-waf-ddos-vpn", "Security", "IMPORTANT", ["Cloudflare", "Cisco", "Amazon"], "Firewalls block bad ports/IPs, WAFs block web attacks (SQLi/XSS), and VPNs create encrypted tunnels."],
    ["What Happens When You Type a URL in the Browser?", "cn-what-happens-url-browser", "End-to-End Synthesis", "MUST_KNOW", ["Google", "Amazon", "Meta"], "Full journey: DNS lookup -> TCP + TLS -> HTTP request -> Server/DB -> HTML/CSS/JS rendering on screen."],
    ["gRPC vs REST vs GraphQL", "cn-grpc-vs-rest-vs-graphql", "API Protocols", "IMPORTANT", ["Google", "Meta", "Uber"], "REST uses JSON over HTTP; gRPC is ultra-fast binary for microservices; GraphQL lets clients pick exact fields."],
  ]),

  // ── 5. OOP & Software Engineering (22) ────────────────────────────────────
  ...buildSubject("OOP & Software Engineering", [
    ["4 Pillars of OOP (Encapsulation, Abstraction, Inheritance, Polymorphism)", "oop-four-pillars", "OOP Core", "MUST_KNOW", ["Amazon", "Microsoft", "Adobe"], "Bundle data safely, hide complexity, reuse parent classes, and let one interface act differently per type."],
    ["Compile-Time (Overloading) vs Runtime Polymorphism (Overriding)", "oop-static-vs-dynamic-polymorphism", "OOP Core", "MUST_KNOW", ["Amazon", "Oracle", "Microsoft"], "Overloading picks a method by its parameters at compile time; overriding picks the child method at runtime."],
    ["Abstract Class vs Interface (Java / C++ / TS)", "oop-abstract-class-vs-interface", "OOP Core", "MUST_KNOW", ["Amazon", "Microsoft", "Goldman Sachs"], "Abstract classes can hold shared fields and constructors; interfaces define pure rules a class must implement."],
    ["Composition over Inheritance & Diamond Problem", "oop-composition-over-inheritance", "OOP Core", "MUST_KNOW", ["Google", "Amazon", "Meta"], "Building classes from smaller parts (HAS-A) is safer and more flexible than deep inheritance trees."],
    ["Association, Aggregation & Composition", "oop-association-aggregation-composition", "OOP Relationships", "IMPORTANT", ["Amazon", "Adobe"], "Compares loose links vs independent ownership (Department-Teacher) vs strict lifetime ownership (House-Room)."],
    ["Deep Copy vs Shallow Copy & Immutability", "oop-deep-vs-shallow-copy", "OOP Core", "MUST_KNOW", ["Amazon", "Microsoft"], "Shallow copy shares nested objects; deep copy duplicates everything so edits don't leak across copies."],
    ["Static, Final/Const & Access Modifiers (Public, Private, Protected)", "oop-static-final-access-modifiers", "OOP Core", "MUST_KNOW", ["Amazon", "Oracle", "Microsoft"], "Controls whether data belongs to the class or an object, locks values from changing, and sets visibility."],
    ["Checked vs Unchecked Exceptions & Try-With-Resources", "oop-checked-vs-unchecked-exceptions", "OOP Core", "MUST_KNOW", ["Amazon", "Oracle", "Goldman Sachs"], "Checked errors must be handled at compile time; unchecked RuntimeExceptions usually mean a coding bug."],
    ["Stack vs Heap Memory & Garbage Collection", "oop-stack-heap-gc", "Runtime & Memory", "IMPORTANT", ["Google", "Oracle", "Amazon"], "Stack holds local variables per thread; Heap holds objects that the Garbage Collector cleans up automatically."],
    ["SOLID: Single Responsibility & Open-Closed (SRP, OCP)", "oop-solid-srp-ocp", "SOLID & Clean Code", "MUST_KNOW", ["Amazon", "Microsoft", "Uber"], "Give each class one clear job, and add new features by extending code instead of rewriting working code."],
    ["SOLID: Liskov, Interface Segregation & Dependency Inversion (LSP, ISP, DIP)", "oop-solid-lsp-isp-dip", "SOLID & Clean Code", "MUST_KNOW", ["Amazon", "Google", "Stripe"], "Child classes shouldn't break parent behavior, keep interfaces small, and depend on abstractions."],
    ["Singleton Pattern (Thread-Safe Single Instance)", "oop-pattern-singleton", "Creational Patterns", "MUST_KNOW", ["Amazon", "Oracle", "Adobe"], "Ensures only one shared instance exists across the app using a private constructor and safe locking."],
    ["Factory Method & Abstract Factory Patterns", "oop-pattern-factory", "Creational Patterns", "MUST_KNOW", ["Amazon", "Microsoft", "Uber"], "Moves object creation into a helper so callers don't need to know which concrete class gets built."],
    ["Builder Pattern & Prototype Pattern", "oop-pattern-builder-prototype", "Creational Patterns", "IMPORTANT", ["Google", "Amazon"], "Builder creates complex objects step-by-step cleanly instead of using constructors with 10 arguments."],
    ["Strategy & Observer Patterns", "oop-pattern-strategy-observer", "Behavioral Patterns", "MUST_KNOW", ["Amazon", "Flipkart", "Uber"], "Strategy swaps algorithms on the fly; Observer notifies subscribed listeners whenever something changes."],
    ["Decorator, Adapter & Facade Patterns", "oop-pattern-decorator-adapter-facade", "Structural Patterns", "IMPORTANT", ["Amazon", "Microsoft"], "Decorator adds features dynamically, Adapter connects mismatched interfaces, and Facade simplifies complex APIs."],
    ["Proxy & Flyweight Patterns", "oop-pattern-proxy-flyweight", "Structural Patterns", "IMPORTANT", ["Amazon", "Google"], "Proxy controls access or lazy-loads; Flyweight shares common data across thousands of objects to save RAM."],
    ["Command, State & Chain of Responsibility Patterns", "oop-pattern-command-state-cor", "Behavioral Patterns", "ADVANCED", ["Uber", "Adobe", "Amazon"], "Turns actions into objects (great for undo/redo), manages state changes, and chains middleware handlers."],
    ["DRY, KISS, YAGNI & Dependency Injection", "se-dry-kiss-yagni-di", "Clean Code", "MUST_KNOW", ["Google", "Stripe", "Amazon"], "Don't repeat code, keep it simple, build only what's needed now, and pass dependencies in for easy testing."],
    ["SDLC Models: Waterfall vs Agile / Scrum / Kanban", "se-sdlc-agile-scrum-kanban", "Software Engineering", "IMPORTANT", ["Amazon", "Microsoft", "Atlassian"], "Compares step-by-step Waterfall with iterative Agile sprints, standups, and Kanban task boards."],
    ["Git Workflows: Merge vs Rebase, Cherry-Pick & Branching", "se-git-merge-rebase", "Version Control", "MUST_KNOW", ["Google", "Meta", "Atlassian"], "Merge keeps full branch history; rebase replays your commits cleanly on top of the latest main branch."],
    ["Testing Pyramid: Unit, Integration, E2E & Mocking", "se-testing-pyramid-mocking", "Quality Assurance", "MUST_KNOW", ["Google", "Stripe", "Amazon"], "Lots of fast unit tests at the base, API/DB integration tests in the middle, and key end-to-end tests on top."],
    ["Code Reviews, Linting & Static Analysis", "se-code-reviews-static-analysis", "Engineering Craft", "IMPORTANT", ["Google", "Meta"], "Catches bugs, style issues, and security risks early through small pull requests and automated checks."],
    ["CI/CD Pipelines & Deployment (Blue-Green, Canary, Rolling)", "se-cicd-blue-green-canary", "DevOps", "IMPORTANT", ["Amazon", "Netflix", "Google"], "Canary tests new code on a few users first; Blue-Green keeps a standby copy for instant zero-downtime rollback."],
    ["Concurrency in OOP: Thread Pools, Futures & Immutability", "oop-concurrency-thread-pools", "Runtime & Memory", "IMPORTANT", ["Amazon", "Goldman Sachs"], "Reuses a fixed pool of worker threads instead of spawning thousands of threads and crashing memory."],
  ]),

  // ── 6. System Design (24) ─────────────────────────────────────────────────
  ...buildSubject("System Design", [
    ["Latency vs Throughput & Tail Latency (p95/p99)", "sd-latency-throughput-p99", "Core Metrics", "MUST_KNOW", ["Google", "Amazon", "Meta"], "Latency is how fast one request is; throughput is how many requests per second; p99 tracks the slowest 1%."],
    ["Vertical vs Horizontal Scaling & Stateless Services", "sd-vertical-vs-horizontal-scaling", "Scaling Foundations", "MUST_KNOW", ["Amazon", "Meta", "Uber"], "Upgrade one machine (vertical) or add more machines (horizontal) by keeping user sessions in Redis/DB."],
    ["Back-of-the-Envelope Estimation (QPS, Storage, Bandwidth)", "sd-capacity-estimation", "Core Metrics", "MUST_KNOW", ["Google", "Meta", "Amazon"], "Quick mental math for traffic and storage: 1M daily users is roughly 12-30 requests/sec on average."],
    ["Caching Strategies: Cache-Aside, Write-Through & Eviction (LRU/LFU)", "sd-caching-strategies-eviction", "Caching", "MUST_KNOW", ["Amazon", "Meta", "Netflix"], "Store hot data in fast memory (Redis) so the database isn't hit every time; evict old items with LRU/LFU."],
    ["Database Replication (Leader-Follower) & Replication Lag", "sd-db-replication-lag", "Data Scaling", "MUST_KNOW", ["Amazon", "Meta", "Uber"], "Copies data to read replicas for scale, while handling the brief delay before followers catch up."],
    ["Database Sharding (Partitioning) & Hotspot Prevention", "sd-db-sharding-hotspots", "Data Scaling", "MUST_KNOW", ["Meta", "Amazon", "Twitter"], "Splits huge tables across multiple servers; uses salted keys so celebrity accounts don't overload one shard."],
    ["Consistent Hashing & Virtual Nodes", "sd-consistent-hashing", "Distributed Systems", "MUST_KNOW", ["Amazon", "Discord", "Uber"], "Maps servers and keys onto a ring so adding or removing a server moves only a tiny fraction of data."],
    ["CAP Theorem & PACELC Theorem", "sd-cap-pacelc-theorem", "Distributed Systems", "MUST_KNOW", ["Amazon", "Google", "Meta"], "When a network splits, pick strict accuracy (CP) or staying online (AP); normally balance speed vs accuracy."],
    ["Distributed Consensus (Raft / Paxos) & Leader Election", "sd-consensus-raft-paxos", "Distributed Systems", "ADVANCED", ["Google", "Databricks", "Amazon"], "How a cluster of servers agrees on one leader and consistent data even when some machines crash."],
    ["Preventing Traffic Overload (Rate Limiting: Token Bucket & Sliding Window)", "sd-rate-limiting-algorithms", "Reliability", "MUST_KNOW", ["Stripe", "Amazon", "Cloudflare"], "Protects APIs from abuse and spikes by capping how many requests a user can send per second."],
    ["Message Queues & Event Streaming (Kafka vs RabbitMQ)", "sd-message-queues-kafka", "Async Architecture", "MUST_KNOW", ["Uber", "LinkedIn", "Amazon"], "Puts heavy background work in a queue so users get fast replies while workers process events smoothly."],
    ["Preventing Duplicate Requests & Retries (Idempotency)", "sd-idempotency-delivery-semantics", "Reliability", "MUST_KNOW", ["Stripe", "Uber", "Amazon"], "Saves a unique request key in Redis/DB so network retries never charge a user's card twice."],
    ["Circuit Breaker, Retries with Exponential Backoff & Jitter", "sd-circuit-breaker-backoff", "Reliability", "IMPORTANT", ["Netflix", "Amazon", "Stripe"], "Stops calling a failing service temporarily and spaces out retries so servers can recover."],
    ["API Gateway vs BFF & Service Discovery", "sd-api-gateway-service-discovery", "Microservices", "IMPORTANT", ["Netflix", "Amazon", "Uber"], "One front door that handles login checks, rate limits, and routing to internal microservices."],
    ["Monolith vs Microservices & Saga Pattern", "sd-monolith-microservices-saga", "Microservices", "IMPORTANT", ["Uber", "Amazon", "Stripe"], "Compares one unified app vs separate services, using Saga undo steps to keep multi-service actions safe."],
    ["Unique ID Generation at Scale (UUID vs Snowflake)", "sd-snowflake-unique-id", "Building Blocks", "IMPORTANT", ["Twitter", "Discord", "Instagram"], "Generates sortable 64-bit unique IDs across distributed servers using timestamp + server ID + counter."],
    ["Bloom Filters & HyperLogLog (Fast Approximate Checks)", "sd-bloom-filters-hll", "Building Blocks", "ADVANCED", ["Google", "Meta", "Cloudflare"], "Uses tiny memory to quickly check 'is this username taken?' or count millions of unique visitors."],
    ["LLD: Design a Parking Lot / Elevator System", "sd-lld-parking-lot-elevator", "Low-Level Design", "MUST_KNOW", ["Amazon", "Microsoft", "Uber"], "Clean class design using Strategy for pricing/dispatch, Factory for spots, and clear state machines."],
    ["LLD: Design an LRU / LFU Cache & Rate Limiter", "sd-lld-lru-rate-limiter", "Low-Level Design", "MUST_KNOW", ["Amazon", "Google", "Meta"], "Pairs a HashMap with a Doubly Linked List for instant O(1) cache lookups and thread-safe updates."],
    ["LLD: Design Splitwise / BookMyShow (Seat Locking)", "sd-lld-splitwise-bookmyshow", "Low-Level Design", "IMPORTANT", ["Flipkart", "Amazon", "Swiggy"], "Stops two users from booking the same movie seat at once using version checks or Redis locks."],
    ["HLD: Design a URL Shortener (TinyURL)", "sd-hld-url-shortener", "High-Level Design", "MUST_KNOW", ["Amazon", "Google", "Meta"], "Turns long URLs into short Base-62 links, redirects fast, and caches popular links in Redis."],
    ["HLD: Design a Notification System & Web Crawler", "sd-hld-notification-crawler", "High-Level Design", "IMPORTANT", ["Amazon", "Google", "Uber"], "Uses priority queues, retry workers, user preferences, and duplicate checks at scale."],
    ["HLD: Design a Real-Time Chat App (WhatsApp / Discord)", "sd-hld-chat-system", "High-Level Design", "MUST_KNOW", ["Meta", "Discord", "Amazon"], "Uses live WebSocket connections, online status heartbeats, and fast message storage."],
    ["HLD: Design a News Feed / Video App (Instagram / YouTube)", "sd-hld-news-feed-video", "High-Level Design", "IMPORTANT", ["Meta", "Netflix", "Google"], "Mixes pre-built feeds for regular users with on-demand reads for celebrities, plus CDN video chunks."],
    ["WebSockets, Pub/Sub & Real-Time Push at Scale", "sd-websockets-pubsub-scale", "Real-Time Architecture", "IMPORTANT", ["Discord", "Uber", "Meta"], "Chat servers hold live user connections and pass messages through Redis/Kafka channels."],
    ["Preventing Cache Stampede & Singleflight", "sd-cache-stampede-singleflight", "Caching", "IMPORTANT", ["Meta", "Netflix", "Cloudflare"], "Stops thousands of users from hitting the database at once when a popular cache key expires."],
  ]),

  // ── 7. Behavioral & HR (45) ───────────────────────────────────────────────
  ...buildSubject("Behavioral & HR", [
    // 1. Introduction & Career Pitch (#1–#7)
    ["Tell me about yourself.", "hr-tell-me-about-yourself", "Introduction & Career Pitch", "MUST_KNOW", ["Amazon", "Google", "TCS", "Infosys"], "Tests clarity, confidence, and a crisp Present -> Past -> Future 60-second story."],
    ["Why did you choose Software Engineering?", "hr-why-software-engineering", "Introduction & Career Pitch", "MUST_KNOW", ["Microsoft", "TCS", "Infosys"], "Tests genuine curiosity for building systems over generic salary or trend answers."],
    ["Walk me through your resume and key projects.", "hr-walk-through-resume", "Introduction & Career Pitch", "MUST_KNOW", ["Amazon", "Flipkart", "Microsoft"], "Tests whether you can connect your skills, projects, and outcomes in a logical narrative."],
    ["What are your greatest strengths?", "hr-greatest-strengths", "Introduction & Career Pitch", "MUST_KNOW", ["TCS", "Infosys", "Amazon"], "Tests self-awareness backed by a real example instead of empty adjectives."],
    ["What is your biggest weakness, and how are you improving it?", "hr-biggest-weakness", "Introduction & Career Pitch", "MUST_KNOW", ["Amazon", "Google", "TCS"], "Tests honesty, self-reflection, and concrete steps taken to turn a gap into progress."],
    ["Where do you see yourself in the next 3 to 5 years?", "hr-where-in-3-to-5-years", "Introduction & Career Pitch", "IMPORTANT", ["Infosys", "TCS", "Microsoft"], "Tests career ambition, growth mindset, and alignment with an engineering track."],
    ["What makes you unique compared to other candidates?", "hr-what-makes-you-unique", "Introduction & Career Pitch", "IMPORTANT", ["Flipkart", "Amazon", "TCS"], "Tests your differentiator—ownership, speed of learning, or end-to-end execution."],

    // 2. Project Ownership & Technical Decisions (#8–#16)
    ["Tell me about the most challenging technical project you have built.", "hr-most-challenging-project", "Project Ownership", "MUST_KNOW", ["Amazon", "Google", "Microsoft"], "Tests depth of problem-solving, ownership, and how you overcame technical roadblocks."],
    ["How did you choose the tech stack and trade-offs for your project?", "hr-choosing-tech-stack-tradeoffs", "Project Ownership", "MUST_KNOW", ["Flipkart", "Uber", "Amazon"], "Tests practical engineering judgment rather than blindly picking trendy tools."],
    ["Describe a time you built a feature from scratch with unclear requirements.", "hr-unclear-requirements-feature", "Project Ownership", "IMPORTANT", ["Amazon", "Google", "Microsoft"], "Tests how you ask clarifying questions, scope an MVP, and iterate."],
    ["Tell me about a time you optimized performance or fixed a tough bug in a project.", "hr-performance-optimization-bug", "Project Ownership", "MUST_KNOW", ["Amazon", "Flipkart", "Microsoft"], "Tests root-cause debugging, measurement before/after, and measurable impact."],
    ["How did you handle security, validation, or edge cases in your application?", "hr-security-edge-cases-project", "Project Ownership", "IMPORTANT", ["Amazon", "Stripe", "Microsoft"], "Tests production mindset—thinking beyond the happy path."],
    ["Describe a time you had to learn a new technology quickly to meet a deadline.", "hr-learn-new-tech-quickly", "Project Ownership", "MUST_KNOW", ["Google", "Amazon", "TCS"], "Tests adaptability, structured learning speed, and hands-on execution."],
    ["What is the technical achievement you are most proud of?", "hr-most-proud-achievement", "Project Ownership", "IMPORTANT", ["Amazon", "Google", "Flipkart"], "Tests passion for craft, ownership, and quantifiable impact."],
    ["Tell me about a time you received critical feedback on your code or project.", "hr-critical-code-feedback", "Project Ownership", "IMPORTANT", ["Google", "Microsoft", "Amazon"], "Tests ego-free coachability and how you turn code review feedback into better habits."],
    ["Explain a complex technical concept from your project to a non-technical person.", "hr-explain-to-non-technical", "Project Ownership", "IMPORTANT", ["Amazon", "Infosys", "Microsoft"], "Tests communication clarity and ability to use simple analogies without jargon."],

    // 3. Teamwork & Conflict Resolution (#17–#24)
    ["Tell me about a time you disagreed with a teammate on an implementation.", "hr-disagreement-with-teammate", "Teamwork & Conflict", "MUST_KNOW", ["Amazon", "Google", "Microsoft"], "Tests respectful debate using data/prototypes rather than ego or stubbornness."],
    ["How did you handle working with an uncooperative or slow team member?", "hr-uncooperative-teammate", "Teamwork & Conflict", "MUST_KNOW", ["TCS", "Infosys", "Amazon"], "Tests empathy, clear communication, task splitting, and keeping the team unblocked."],
    ["Describe a time you helped a struggling teammate meet a deadline.", "hr-helped-struggling-teammate", "Teamwork & Conflict", "IMPORTANT", ["Microsoft", "Google", "Infosys"], "Tests collaboration, patience, and putting team delivery first."],
    ["Tell me about a time a group project fell behind and you stepped up.", "hr-group-project-fell-behind", "Teamwork & Conflict", "MUST_KNOW", ["Amazon", "Flipkart", "TCS"], "Tests ownership under pressure and ability to re-prioritize and rally teammates."],
    ["How did you adapt when your project scope or requirements changed mid-way?", "hr-scope-changed-midway", "Teamwork & Conflict", "IMPORTANT", ["Amazon", "Microsoft", "Flipkart"], "Tests flexibility, calm re-planning, and pragmatic delivery."],
    ["Describe how you collaborated with people who had very different working styles.", "hr-different-working-styles", "Teamwork & Conflict", "IMPORTANT", ["Google", "Infosys", "Microsoft"], "Tests emotional intelligence and adapting communication to keep teamwork smooth."],
    ["Tell me about a time you convinced your team to adopt your idea.", "hr-convinced-team-idea", "Teamwork & Conflict", "IMPORTANT", ["Amazon", "Google", "Flipkart"], "Tests persuasion backed by pros/cons, demos, or user impact."],
    ["How do you handle credit or recognition fairly in a team setting?", "hr-credit-recognition-team", "Teamwork & Conflict", "ADVANCED", ["Google", "Microsoft", "Amazon"], "Tests humility, team-first attitude, and healthy engineering culture."],

    // 4. Failures, Pressure & Deadlines (#25–#33)
    ["Tell me about a time you failed or missed a goal, and what you learned.", "hr-time-you-failed", "Failures & Pressure", "MUST_KNOW", ["Amazon", "Google", "Microsoft"], "Tests accountability—owning the mistake without blaming others and showing real change."],
    ["How do you handle tight deadlines, such as exam and project crunches?", "hr-tight-deadlines-crunch", "Failures & Pressure", "MUST_KNOW", ["TCS", "Infosys", "Amazon"], "Tests prioritization, time-blocking, and staying calm without cutting critical corners."],
    ["Describe a time you had to fix a critical bug or issue under high pressure.", "hr-critical-bug-under-pressure", "Failures & Pressure", "MUST_KNOW", ["Amazon", "Flipkart", "Uber"], "Tests composure, systematic debugging, and communication during an incident."],
    ["Tell me about a mistake you made and how you owned up to it.", "hr-mistake-owned-up", "Failures & Pressure", "MUST_KNOW", ["Amazon", "Google", "Infosys"], "Tests integrity, transparency, and proactive damage control."],
    ["How do you juggle multiple competing priorities at the same time?", "hr-competing-priorities", "Failures & Pressure", "IMPORTANT", ["Microsoft", "Amazon", "TCS"], "Tests structured planning (impact vs urgency) and expectation setting."],
    ["Describe a situation where you were stuck on an ambiguous problem with no clear answer.", "hr-stuck-ambiguous-problem", "Failures & Pressure", "IMPORTANT", ["Google", "Amazon", "Microsoft"], "Tests bias for action—breaking unknowns into small experiments."],
    ["Tell me about a time you received a lower grade or evaluation than expected.", "hr-lower-grade-evaluation", "Failures & Pressure", "IMPORTANT", ["TCS", "Infosys", "Flipkart"], "Tests resilience, maturity, and how you turned disappointment into action."],
    ["How do you stay motivated during repetitive debugging or long interview prep?", "hr-staying-motivated-prep", "Failures & Pressure", "IMPORTANT", ["Flipkart", "TCS", "Amazon"], "Tests consistency, habit-building, and long-term grit."],
    ["Describe a time you turned negative feedback into a measurable improvement.", "hr-negative-feedback-improvement", "Failures & Pressure", "MUST_KNOW", ["Amazon", "Google", "Microsoft"], "Tests growth mindset and willingness to act on constructive criticism."],

    // 5. Leadership, Initiative & Ethics (#34–#40)
    ["Tell me about a time you took initiative without being asked.", "hr-took-initiative-unasked", "Leadership & Ethics", "MUST_KNOW", ["Amazon", "Google", "Flipkart"], "Tests proactive ownership—spotting a problem and fixing it independently."],
    ["Describe a time you led a team, college event, or hackathon project.", "hr-led-team-hackathon", "Leadership & Ethics", "MUST_KNOW", ["Amazon", "Microsoft", "TCS"], "Tests delegation, decision-making, and keeping everyone aligned toward a goal."],
    ["Tell me about a time you mentored or taught a junior or peer.", "hr-mentored-junior-peer", "Leadership & Ethics", "IMPORTANT", ["Google", "Microsoft", "Infosys"], "Tests empathy, patience, and ability to elevate others around you."],
    ["Describe a time you spotted an inefficiency and improved the process.", "hr-spotted-inefficiency-improved", "Leadership & Ethics", "IMPORTANT", ["Amazon", "Uber", "Flipkart"], "Tests continuous improvement and automation mindset."],
    ["Tell me about a time you faced an ethical dilemma or integrity test.", "hr-ethical-dilemma-integrity", "Leadership & Ethics", "IMPORTANT", ["Amazon", "Infosys", "TCS"], "Tests honesty, doing the right thing even when no one is watching."],
    ["Describe a time you stepped far out of your comfort zone.", "hr-stepped-out-comfort-zone", "Leadership & Ethics", "IMPORTANT", ["Google", "Microsoft", "Amazon"], "Tests courage to take on unfamiliar challenges and grow quickly."],
    ["How do you balance code quality vs. speed when facing a strict deadline?", "hr-quality-vs-speed-balance", "Leadership & Ethics", "ADVANCED", ["Amazon", "Stripe", "Flipkart"], "Tests pragmatic engineering—shipping an MVP safely while logging conscious tech debt."],

    // 6. Company Fit & HR Closing (#41–#45)
    ["Why do you want to join our company specifically?", "hr-why-this-company", "Company Fit & Closing", "MUST_KNOW", ["Amazon", "Google", "Microsoft", "TCS", "Infosys"], "Tests whether you researched the company's products, tech, and culture."],
    ["Why should we hire you over other qualified candidates?", "hr-why-should-we-hire-you", "Company Fit & Closing", "MUST_KNOW", ["TCS", "Infosys", "Amazon", "Flipkart"], "Tests your concise 3-point value proposition (skills + execution + culture fit)."],
    ["Are you comfortable with relocation, shifts, or hybrid work?", "hr-relocation-hybrid-flexibility", "Company Fit & Closing", "MUST_KNOW", ["TCS", "Infosys", "Amazon"], "Tests practical readiness and positive, adaptable attitude."],
    ["How do you handle rejection or a tough interview round?", "hr-handling-rejection", "Company Fit & Closing", "IMPORTANT", ["Infosys", "TCS", "Flipkart"], "Tests emotional resilience and treating every interview as a learning loop."],
    ["Do you have any questions for us?", "hr-questions-to-ask-interviewer", "Company Fit & Closing", "MUST_KNOW", ["Google", "Amazon", "Microsoft", "Flipkart"], "Tests genuine curiosity—always ask thoughtful questions about the team, tech, or growth."],
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
