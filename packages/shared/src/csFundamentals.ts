import { z } from "zod";

export const CS_SUBJECTS = [
  "Operating Systems",
  "DBMS",
  "SQL & Query Patterns",
  "Computer Networks",
  "OOP & Software Engineering",
  "Software Engineering",
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
  // ── 1. Operating Systems (30) ─────────────────────────────────────────────
  ...buildSubject("Operating Systems", [
    ["What is an Operating System & Why Do We Need It?", "os-01-what-is-an-os", "OS Basics & Booting", "MUST_KNOW", ["Microsoft", "Amazon", "TCS"], "How the OS sits between you, your apps, and your computer's hardware (CPU, RAM, disk)."],
    ["What Happens When You Turn On a Computer? (Booting)", "os-02-booting-process", "OS Basics & Booting", "MUST_KNOW", ["Microsoft", "Qualcomm", "Dell"], "Simple step-by-step journey from pressing the power button (BIOS/UEFI -> Bootloader -> OS loading)."],
    ["Kernel vs Shell & User Mode vs Kernel Mode", "os-03-kernel-vs-shell", "OS Basics & Booting", "MUST_KNOW", ["Microsoft", "Amazon", "Google"], "The core brain of the OS (kernel), how you talk to it (shell/GUI), and why apps aren't allowed direct hardware access."],
    ["System Calls & Interrupts: How Apps Ask the OS for Help", "os-04-system-calls-interrupts", "OS Basics & Booting", "MUST_KNOW", ["Microsoft", "Amazon", "Qualcomm"], "Understanding fork(), exec(), wait(), open(), read(), write(), and how hardware interrupts pause the CPU."],
    ["Types of Operating Systems (Batch, Time-Sharing, Real-Time & Distributed)", "os-05-types-of-os", "OS Basics & Booting", "IMPORTANT", ["TCS", "Infosys", "Microsoft"], "How different OS types power laptops, servers, ATMs, and embedded devices."],
    ["What is a Process & The 5 Process States", "os-06-what-is-a-process", "Processes & Threads", "MUST_KNOW", ["Amazon", "Oracle", "Microsoft"], "Program vs running process, and how a process moves through New, Ready, Running, Waiting, and Terminated."],
    ["Process Control Block (PCB) & Context Switching", "os-07-pcb-and-context-switching", "Processes & Threads", "MUST_KNOW", ["Google", "Microsoft", "Amazon"], "How the OS saves your app's exact progress when switching the CPU to another app."],
    ["Child Processes (fork), Zombie, Orphan & Daemon Processes", "os-08-zombie-orphan-daemon", "Processes & Threads", "IMPORTANT", ["Amazon", "Oracle", "Qualcomm"], "How processes create child processes and what happens when parent or child finishes first."],
    ["What is a Thread? (Process vs Thread & Multithreading)", "os-09-threads-vs-processes", "Processes & Threads", "MUST_KNOW", ["Amazon", "Microsoft", "Meta"], "Why threads inside the same app share memory, user vs kernel threads, and concurrency vs parallelism."],
    ["Inter-Process Communication (IPC): How Processes Talk", "os-10-inter-process-communication", "Processes & Threads", "MUST_KNOW", ["Amazon", "Microsoft", "Cisco"], "Shared memory, message passing, pipes, signals, and sockets explained simply."],
    ["CPU Scheduling Basics & Preemptive vs Non-Preemptive", "os-11-cpu-scheduling-basics", "CPU Scheduling", "MUST_KNOW", ["Amazon", "Microsoft"], "How the OS picks which ready process gets the CPU next, plus waiting time & turnaround time."],
    ["FCFS & SJF / SRTF CPU Scheduling (With Step-by-Step Gantt Charts)", "os-12-fcfs-and-sjf-scheduling", "CPU Scheduling", "MUST_KNOW", ["Amazon", "Flipkart"], "First-Come First-Served vs Shortest Job First and how to solve basic scheduling numericals."],
    ["Round Robin, Priority Scheduling, Starvation & Aging", "os-13-round-robin-priority-aging", "CPU Scheduling", "MUST_KNOW", ["Microsoft", "Adobe", "Google"], "Fair time-sharing with time slices, multilevel queues, and preventing starvation with aging."],
    ["Race Conditions & Critical Section Explained Simply", "os-14-race-condition-critical-section", "Process Synchronization", "MUST_KNOW", ["Amazon", "Meta", "Microsoft"], "Why two threads updating the same bank balance at once corrupts data, and the 3 rules of critical sections."],
    ["Mutex vs Semaphore (Locks & Signaling)", "os-15-mutex-vs-semaphore", "Process Synchronization", "MUST_KNOW", ["Amazon", "Microsoft", "Qualcomm"], "Locking a resource with a Mutex vs counting permits with a Semaphore, plus spinlocks and monitors."],
    ["Producer-Consumer, Reader-Writer & Dining Philosophers", "os-16-classic-sync-problems", "Process Synchronization", "IMPORTANT", ["Amazon", "Microsoft", "Oracle"], "Simple intuition for the 3 classic synchronization interview problems."],
    ["What is a Deadlock & Its 4 Necessary Conditions", "os-17-what-is-deadlock", "Deadlocks", "MUST_KNOW", ["Amazon", "Google", "Microsoft"], "Mutual exclusion, hold & wait, no preemption, and circular wait with a simple traffic-jam analogy."],
    ["Deadlock Prevention, Avoidance (Banker's Algorithm) & Livelock", "os-18-deadlock-prevention-bankers", "Deadlocks", "MUST_KNOW", ["Amazon", "Oracle", "Microsoft"], "How to prevent or avoid deadlocks, plus deadlock vs starvation vs livelock."],
    ["How RAM Works: Logical vs Physical Address & Swapping", "os-19-logical-vs-physical-address", "Memory Management", "MUST_KNOW", ["Qualcomm", "Microsoft"], "How programs use virtual addresses and how the MMU maps them to real RAM locations."],
    ["Memory Allocation (First/Best/Worst Fit) & Fragmentation", "os-20-contiguous-allocation-fragmentation", "Memory Management", "MUST_KNOW", ["Amazon", "Oracle"], "Internal vs external fragmentation and why wasted gaps appear in RAM."],
    ["Paging & Page Tables Explained Simply", "os-21-paging-and-page-table", "Memory Management", "MUST_KNOW", ["Google", "Microsoft", "Amazon"], "Splitting programs into fixed-size pages and RAM into frames to solve external fragmentation."],
    ["TLB Cache & Segmentation vs Paging", "os-22-tlb-and-segmentation", "Memory Management", "IMPORTANT", ["Google", "Qualcomm", "Nvidia"], "How the Translation Lookaside Buffer speeds up paging and how segmentation groups logical code/data."],
    ["Virtual Memory, Demand Paging & Page Faults", "os-23-virtual-memory-demand-paging", "Virtual Memory", "MUST_KNOW", ["Amazon", "Google", "Microsoft"], "How your laptop runs an 8 GB game on 4 GB RAM by loading pages only when needed."],
    ["Page Replacement Algorithms (FIFO, Optimal, LRU & Clock)", "os-24-page-replacement-fifo-lru", "Virtual Memory", "MUST_KNOW", ["Amazon", "Microsoft"], "Deciding which old page to remove from RAM when a page fault happens, plus Belady's Anomaly."],
    ["Thrashing, Working Set Model & Copy-on-Write", "os-25-thrashing-and-copy-on-write", "Virtual Memory", "MUST_KNOW", ["Google", "Amazon"], "Why excessive page faults freeze your computer and how Copy-on-Write makes fork() super fast."],
    ["File Systems, Directories & Inodes (FAT vs Inode)", "os-26-file-systems-and-inodes", "File Systems & I/O", "MUST_KNOW", ["Meta", "Amazon", "Google"], "How files and folders are organized on disk and how an inode tracks file metadata."],
    ["File Allocation on Disk: Contiguous, Linked & Indexed", "os-27-file-allocation-methods", "File Systems & I/O", "IMPORTANT", ["Amazon", "Oracle"], "How the OS stores file blocks on storage drives and tracks free space."],
    ["Disk Scheduling Algorithms (FCFS, SSTF, SCAN & C-SCAN)", "os-28-disk-scheduling-algorithms", "File Systems & I/O", "IMPORTANT", ["Oracle", "Dell", "Amazon"], "Reducing disk read/write head movement time."],
    ["RAID Storage Basics (0, 1, 5, 10) & DMA / Buffering I/O", "os-29-raid-and-io-dma", "File Systems & I/O", "IMPORTANT", ["Oracle", "Qualcomm", "Nvidia"], "Mirroring/striping disks for speed and safety, plus how DMA transfers data without blocking the CPU."],
    ["Monolithic vs Microkernel & Virtual Machines vs Containers", "os-30-vms-vs-containers-monolithic", "Architecture & Virtualization", "ADVANCED", ["Amazon", "Google", "Microsoft"], "Final synthesis comparing OS kernel architectures and lightweight Docker containers vs full VMs."],
  ]),

  // ── 2. DBMS (24) ──────────────────────────────────────────────────────────
  ...buildSubject("DBMS", [
    ["What is Data, a Database & Why Flat Files Fail?", "dbms-01-what-is-data-and-database", "DBMS Foundations", "MUST_KNOW", ["Oracle", "Amazon", "TCS"], "Why storing app data in text files or spreadsheets breaks down, and how databases solve it."],
    ["DBMS vs RDBMS (Tables, Rows, Columns & Relational Terms)", "dbms-02-dbms-vs-rdbms", "DBMS Foundations", "MUST_KNOW", ["Amazon", "Oracle", "Microsoft"], "Understanding relations, tuples, attributes, domains, and SQL vs MySQL/PostgreSQL/Oracle."],
    ["Database Languages Explained (DDL, DML, DCL & TCL)", "dbms-03-dbms-languages-ddl-dml", "DBMS Foundations", "MUST_KNOW", ["Amazon", "Oracle", "TCS"], "Grouping SQL commands into structure (CREATE/ALTER), data (SELECT/INSERT), permissions (GRANT), and transactions (COMMIT)."],
    ["3-Level Database Architecture & Data Independence", "dbms-04-schema-architecture-independence", "DBMS Foundations", "IMPORTANT", ["Oracle", "Amazon"], "External, conceptual, and internal views, plus logical vs physical data independence."],
    ["ER Diagrams Part 1: Entities, Attributes & Weak Entities", "dbms-05-er-diagram-entities-attributes", "ER Modeling", "MUST_KNOW", ["Amazon", "Flipkart"], "Modeling real-world objects, simple/composite/derived/multivalued attributes, and weak entities."],
    ["ER Diagrams Part 2: Relationships & Cardinality (1:1, 1:N, M:N)", "dbms-06-er-relationships-cardinality", "ER Modeling", "MUST_KNOW", ["Amazon", "Microsoft"], "Mapping how tables relate (e.g., Students & Courses) and converting ER diagrams into SQL tables."],
    ["Database Keys Part 1: Super Key, Candidate Key, Primary & Alternate Key", "dbms-07-keys-super-candidate-primary", "Keys & Constraints", "MUST_KNOW", ["Amazon", "Microsoft", "Goldman Sachs"], "How to uniquely identify every row in a table step-by-step."],
    ["Database Keys Part 2: Foreign Key, Unique Key & Referential Integrity", "dbms-08-foreign-key-unique-constraints", "Keys & Constraints", "MUST_KNOW", ["Amazon", "Oracle"], "Primary vs Unique key, linking tables with Foreign Keys, and ON DELETE CASCADE / SET NULL / RESTRICT."],
    ["Why Do We Normalize Tables? (Anomalies & Functional Dependencies)", "dbms-09-why-normalization-functional-dep", "Normalization", "MUST_KNOW", ["Amazon", "Oracle"], "Insertion, update, and deletion anomalies in messy tables and how functional dependencies work."],
    ["1NF, 2NF & 3NF Explained Step-by-Step With One Table Example", "dbms-10-1nf-2nf-3nf-step-by-step", "Normalization", "MUST_KNOW", ["Amazon", "Microsoft", "Flipkart"], "Taking a single unnormalized table and cleaning it through 1NF, 2NF (partial dependency), and 3NF (transitive dependency)."],
    ["BCNF, Lossless Decomposition & Denormalization", "dbms-11-bcnf-and-denormalization", "Normalization", "IMPORTANT", ["Oracle", "Amazon", "Uber"], "When 3NF needs BCNF and when engineers intentionally denormalize tables for faster reads."],
    ["Transactions & ACID Properties Explained Simply", "dbms-12-what-is-transaction-acid", "Transactions & Concurrency", "MUST_KNOW", ["Amazon", "Google", "Goldman Sachs"], "Using a UPI/bank transfer example to understand Atomicity, Consistency, Isolation, Durability, COMMIT & ROLLBACK."],
    ["Concurrency Bugs: Dirty Read, Non-Repeatable Read & Phantom Read", "dbms-13-dirty-nonrepeatable-phantom-reads", "Transactions & Concurrency", "MUST_KNOW", ["Amazon", "Microsoft", "Uber"], "What goes wrong when two users read and write the same rows simultaneously."],
    ["SQL Isolation Levels (Read Uncommitted to Serializable)", "dbms-14-sql-isolation-levels", "Transactions & Concurrency", "MUST_KNOW", ["Amazon", "Meta", "Uber"], "How databases balance data accuracy vs speed across the 4 standard isolation levels."],
    ["Database Locks (Shared/Exclusive), Two-Phase Locking (2PL) & Deadlocks", "dbms-15-locks-and-two-phase-locking", "Transactions & Concurrency", "IMPORTANT", ["Oracle", "Amazon"], "How read/write locks and Strict 2PL prevent conflicting updates."],
    ["Serial vs Concurrent Schedules & Conflict Serializability", "dbms-16-serializability-schedules", "Transactions & Concurrency", "ADVANCED", ["Oracle", "Amazon"], "Checking whether concurrent transactions produce the same result as running one after another."],
    ["What is an Index & Why Does It Speed Up Queries?", "dbms-17-what-is-database-indexing", "Indexing & Query Internals", "MUST_KNOW", ["Amazon", "Google", "Microsoft"], "Book-index analogy: Index seek vs full table scan, and why too many indexes slow down writes."],
    ["Clustered vs Non-Clustered Index (Primary, Secondary & Composite)", "dbms-18-clustered-vs-non-clustered-index", "Indexing & Query Internals", "MUST_KNOW", ["Amazon", "Microsoft", "Flipkart"], "Physical row ordering vs separate lookup pointers and choosing the right columns to index."],
    ["How B-Trees & B+ Trees Power Database Indexes", "dbms-19-b-tree-and-b-plus-tree", "Indexing & Query Internals", "MUST_KNOW", ["Amazon", "Google", "Oracle"], "Why B+ trees make range queries (BETWEEN, >) and disk reads ultra-fast."],
    ["Query Execution Plans, Crash Recovery (Undo/Redo) & Checkpoints", "dbms-20-query-execution-and-recovery", "Indexing & Query Internals", "IMPORTANT", ["Google", "Databricks", "Oracle"], "How SQL queries are parsed/optimized and how Write-Ahead Logs recover data after a crash."],
    ["Backups, Read Replicas & Database Sharding Basics", "dbms-21-backups-replication-sharding", "Scaling & Modern DBs", "IMPORTANT", ["Amazon", "Uber", "Meta"], "Protecting data and scaling databases when a single server gets full."],
    ["SQL vs NoSQL Databases (Document, Key-Value, Column & Graph)", "dbms-22-sql-vs-nosql-databases", "Scaling & Modern DBs", "MUST_KNOW", ["Amazon", "Meta", "Google"], "Comparing PostgreSQL/MySQL with MongoDB/Redis and knowing when to pick each."],
    ["CAP Theorem & ACID vs BASE Properties", "dbms-23-cap-theorem-acid-vs-base", "Scaling & Modern DBs", "IMPORTANT", ["Amazon", "Uber", "Google"], "Understanding Consistency, Availability, and Partition Tolerance in distributed databases."],
    ["End-to-End Practice: Designing a Database Schema for Your Project", "dbms-24-designing-real-db-schema", "Scaling & Modern DBs", "MUST_KNOW", ["Amazon", "Flipkart", "Uber"], "Step-by-step schema design for an E-Commerce / Hospital / Student-Course app for interviews."],
  ]),

  // ── 3. SQL & Query Patterns (14) ──────────────────────────────────────────
  ...buildSubject("SQL & Query Patterns", [
    ["SQL Day 1: Reading & Filtering Data (SELECT, FROM, WHERE)", "sql-01-select-from-where-basics", "SQL Foundations", "MUST_KNOW", ["Amazon", "Oracle", "TCS"], "Writing your very first queries with comparison operators (=, <>, IN, BETWEEN, LIKE, IS NULL)."],
    ["Sorting, Limiting & Removing Duplicates (ORDER BY, LIMIT, DISTINCT, AS)", "sql-02-order-by-limit-distinct-aliases", "SQL Foundations", "MUST_KNOW", ["Amazon", "Oracle", "Microsoft"], "Organizing query results cleanly and naming output columns with aliases."],
    ["Summarizing Numbers (COUNT, SUM, AVG, MIN, MAX)", "sql-03-aggregate-functions-count-sum-avg", "Aggregations & Functions", "MUST_KNOW", ["Amazon", "Microsoft"], "Calculating totals, averages, and row counts across tables."],
    ["Grouping Data (GROUP BY) & WHERE vs HAVING", "sql-04-group-by-and-having-vs-where", "Aggregations & Functions", "MUST_KNOW", ["Amazon", "Microsoft"], "Grouping rows by category/department and filtering groups with HAVING."],
    ["Useful SQL Functions: Strings, Dates, CASE WHEN & COALESCE", "sql-05-string-date-case-coalesce", "Aggregations & Functions", "MUST_KNOW", ["Amazon", "Google", "Meta"], "Formatting text, calculating date differences, writing IF/ELSE logic in SQL, and replacing NULLs."],
    ["SQL Joins Made Simple (INNER, LEFT, RIGHT, FULL & CROSS Join)", "sql-06-inner-left-right-full-joins", "Joins & Subqueries", "MUST_KNOW", ["Amazon", "Microsoft", "Flipkart"], "Combining data from two or more related tables visually without losing or duplicating rows."],
    ["Self Joins: Joining a Table With Itself", "sql-07-self-join-explained", "Joins & Subqueries", "MUST_KNOW", ["Amazon", "Meta", "Oracle"], "Solving classic employee-manager hierarchy questions using table aliases."],
    ["Subqueries (Nested Queries) & EXISTS vs IN", "sql-08-subqueries-and-exists", "Joins & Subqueries", "MUST_KNOW", ["Amazon", "Microsoft", "Meta"], "Writing queries inside queries and handling NULLs safely with EXISTS."],
    ["Combining Query Results (UNION vs UNION ALL, INTERSECT, EXCEPT)", "sql-09-union-intersect-except", "Joins & Subqueries", "IMPORTANT", ["Amazon", "Oracle"], "Stacking rows from multiple SELECT queries cleanly."],
    ["Creating Tables & DELETE vs TRUNCATE vs DROP", "sql-10-create-alter-delete-truncate-drop", "DDL, DML & Objects", "MUST_KNOW", ["Amazon", "Oracle", "Flipkart"], "Adding constraints in CREATE TABLE and knowing the exact differences between DELETE, TRUNCATE, and DROP."],
    ["SQL Views, Stored Procedures & Triggers Basics", "sql-11-views-procedures-triggers", "DDL, DML & Objects", "IMPORTANT", ["Oracle", "Microsoft"], "Saving reusable virtual tables (VIEW) and automating actions on insert/update."],
    ["CTEs (WITH) & Window Functions (ROW_NUMBER, RANK, DENSE_RANK, LAG, LEAD)", "sql-12-ctes-and-window-functions", "CTEs, Windows & Interview Queries", "MUST_KNOW", ["Amazon", "Meta", "Flipkart"], "Modern SQL techniques for clean multi-step queries and per-group rankings."],
    ["Must-Practice Interview Queries Part 1: 2nd / Nth Highest Salary & Top 3 Per Dept", "sql-13-interview-query-nth-highest-salary", "CTEs, Windows & Interview Queries", "MUST_KNOW", ["Amazon", "Microsoft", "Google"], "Solving the #1 most asked SQL interview question 3 different ways."],
    ["Must-Practice Interview Queries Part 2: Duplicate Records, Unordered Products & Active Users", "sql-14-interview-query-duplicates-unmatched", "CTEs, Windows & Interview Queries", "MUST_KNOW", ["Amazon", "Meta", "Swiggy"], "Finding/deleting duplicate emails, products never ordered, and >3 orders queries."],
  ]),

  // ── 4. Computer Networks (25) ─────────────────────────────────────────────
  ...buildSubject("Computer Networks", [
    ["What is a Computer Network & How Do Devices Talk?", "cn-01-what-is-computer-network", "Networking Basics", "MUST_KNOW", ["Cisco", "Amazon", "TCS"], "Everyday intuition for networks, client-server vs peer-to-peer, and simplex/half-duplex/full-duplex modes."],
    ["Network Types (PAN, LAN, MAN, WAN) & Topologies (Star, Mesh, Bus, Ring)", "cn-02-pan-lan-man-wan-topologies", "Networking Basics", "MUST_KNOW", ["Cisco", "Qualcomm"], "From Bluetooth/Wi-Fi at home to global undersea fiber cables, plus cables vs wireless media."],
    ["Bandwidth vs Latency vs Throughput & Circuit vs Packet Switching", "cn-03-bandwidth-latency-switching", "Networking Basics", "MUST_KNOW", ["Cisco", "Amazon", "Google"], "Why fast internet speed (bandwidth) isn't the same as low ping (latency), and how packets travel."],
    ["Network Devices: Hub vs Switch vs Router (Plus Modem & Gateway)", "cn-04-hub-vs-switch-vs-router", "Networking Basics", "MUST_KNOW", ["Cisco", "Amazon", "Microsoft"], "What each box actually does in your home and office network."],
    ["The 7 Layers of the OSI Model Explained Simply", "cn-05-osi-model-7-layers", "OSI & TCP/IP Models", "MUST_KNOW", ["Cisco", "Amazon", "Microsoft"], "Step-by-step memory guide for all 7 layers, their jobs, protocols, and data units (Bits, Frames, Packets, Segments)."],
    ["TCP/IP Model (4 Layers) & Data Encapsulation / Decapsulation", "cn-06-tcp-ip-model-encapsulation", "OSI & TCP/IP Models", "MUST_KNOW", ["Cisco", "Amazon", "Google"], "How real-world internet protocols map to OSI and how headers wrap your message at each layer."],
    ["MAC Address vs IP Address: Hardware ID vs Network Location", "cn-07-mac-address-vs-ip-address", "Data Link & Switching", "MUST_KNOW", ["Cisco", "Qualcomm", "Amazon"], "Why every device needs both a permanent MAC address and a changeable IP address."],
    ["Ethernet, How a Switch Learns & ARP (IP-to-MAC Lookup)", "cn-08-arp-and-ethernet-switching", "Data Link & Switching", "MUST_KNOW", ["Cisco", "Arista"], "How your laptop finds the router's MAC address on local Wi-Fi/Ethernet, plus VLAN basics."],
    ["Error Detection (Parity, Checksum, CRC) & Sliding Window Flow Control", "cn-09-error-detection-flow-control", "Data Link & Switching", "IMPORTANT", ["Cisco", "Qualcomm"], "Stop-and-Wait, Go-Back-N, and Selective Repeat for reliable frame delivery."],
    ["IPv4 Addresses, Public vs Private IPs & IPv4 vs IPv6", "cn-10-ipv4-classes-public-private-ipv6", "IP Addressing & Routing", "MUST_KNOW", ["Cisco", "Amazon", "Google"], "Understanding 192.168.x.x private ranges and why the world is moving to 128-bit IPv6."],
    ["Subnet Mask, CIDR (/24, /26) & Subnetting Made Easy", "cn-11-subnetting-and-cidr-basics", "IP Addressing & Routing", "MUST_KNOW", ["Cisco", "Amazon", "Cloudflare"], "Step-by-step beginner guide to finding Network Address, Broadcast Address, and Usable Host count."],
    ["NAT (Network Address Translation) & Default Gateway Explained", "cn-12-nat-and-default-gateway", "IP Addressing & Routing", "MUST_KNOW", ["Cisco", "Amazon", "Cloudflare"], "How your home router lets 10 devices share 1 public IP address."],
    ["DHCP (How Devices Get IPs Automatically) & ICMP (ping / traceroute)", "cn-13-dhcp-and-icmp-ping", "IP Addressing & Routing", "MUST_KNOW", ["Cisco", "Google", "Cloudflare"], "The 4-step DORA process and diagnosing network issues with ping and traceroute."],
    ["How Routers Find Paths: Static vs Dynamic Routing (RIP, OSPF, BGP)", "cn-14-routing-rip-ospf-bgp", "IP Addressing & Routing", "IMPORTANT", ["Cisco", "Cloudflare", "Amazon"], "Distance Vector vs Link State vs Path Vector routing explained without heavy math."],
    ["Ports, Sockets & TCP vs UDP (Reliability vs Speed)", "cn-15-ports-sockets-tcp-vs-udp", "Transport Layer (TCP & UDP)", "MUST_KNOW", ["Amazon", "Google", "Meta"], "Common ports (80, 443, 53, 22, 25), TCP vs HTTP, and why video calls use UDP while web pages use TCP."],
    ["TCP 3-Way Handshake (SYN, SYN-ACK, ACK) & Connection Close (FIN)", "cn-16-tcp-three-way-handshake", "Transport Layer (TCP & UDP)", "MUST_KNOW", ["Amazon", "Google", "Cloudflare"], "Step-by-step diagram of how TCP opens and closes a reliable connection."],
    ["TCP Flow Control vs Congestion Control (Slow Start & Retransmit)", "cn-17-tcp-flow-and-congestion-control", "Transport Layer (TCP & UDP)", "IMPORTANT", ["Google", "Amazon", "Cisco"], "How TCP avoids overwhelming the receiver or clogging the internet."],
    ["DNS Explained: Turning google.com Into an IP Address", "cn-18-dns-how-domain-names-work", "Application Layer & Web", "MUST_KNOW", ["Google", "Amazon", "Cloudflare"], "Root, TLD, and Authoritative servers, recursive vs iterative queries, and A/AAAA/CNAME/MX records."],
    ["HTTP Basics: Requests, Methods (GET/POST/PUT/DELETE) & Status Codes", "cn-19-http-methods-and-status-codes", "Application Layer & Web", "MUST_KNOW", ["Amazon", "Stripe", "Meta"], "Understanding 200, 201, 301, 400, 401, 403, 404, 500, 502, 503 in plain English."],
    ["Cookies vs Sessions, HTTP/1.1 vs HTTP/2 vs HTTP/3 & WebSockets", "cn-20-cookies-sessions-http2-websockets", "Application Layer & Web", "MUST_KNOW", ["Google", "Cloudflare", "Meta"], "How websites remember you're logged in and how real-time chat apps stay connected."],
    ["HTTP vs HTTPS: How TLS Encryption & SSL Certificates Keep Data Safe", "cn-21-https-tls-and-certificates", "Application Layer & Web", "MUST_KNOW", ["Google", "Amazon", "Stripe"], "Symmetric + asymmetric encryption and Certificate Authorities explained simply."],
    ["Email (SMTP, POP3, IMAP), File Transfer (FTP/SFTP) & SSH", "cn-22-email-ftp-ssh-protocols", "Application Layer & Web", "IMPORTANT", ["Cisco", "Microsoft"], "How sending and receiving emails work under the hood."],
    ["Classic Interview Question: What Happens When You Type a URL in Browser?", "cn-23-what-happens-when-you-type-url", "Application Layer & Web", "MUST_KNOW", ["Google", "Amazon", "Meta"], "Tying DNS, ARP, TCP, TLS, HTTP, and page rendering together into one clear story."],
    ["Network Security Part 1: Firewalls, Proxy Servers, VPNs & IDS/IPS", "cn-24-firewalls-proxy-vpn", "Network Security", "MUST_KNOW", ["Cloudflare", "Cisco", "Amazon"], "How companies protect internal networks and encrypt remote traffic."],
    ["Network Security Part 2: MITM, DDoS, SQL Injection, XSS & CSRF Basics", "cn-25-common-web-security-attacks", "Network Security", "IMPORTANT", ["Amazon", "Google", "Stripe"], "Recognizing common security threats and basic developer defenses."],
  ]),

  // ── 5. OOP & Software Engineering (25) ────────────────────────────────────
  ...buildSubject("OOP & Software Engineering", [
    ["OOP Day 1: Why Do We Need OOP? (Procedural vs Object-Oriented Thinking)", "oop-01-why-oop-procedural-vs-oop", "OOP Basics & Memory", "MUST_KNOW", ["Amazon", "Microsoft", "TCS"], "How grouping data and functions into objects makes large codebases clean and reusable."],
    ["Classes & Objects: Blueprint vs Real House (State, Behavior & Identity)", "oop-02-classes-objects-state-behavior", "OOP Basics & Memory", "MUST_KNOW", ["Amazon", "Oracle", "Microsoft"], "Writing your first class, creating objects with new, and accessing attributes and methods."],
    ["this Keyword vs static Keyword (Instance vs Class Members)", "oop-03-this-and-static-keywords", "OOP Basics & Memory", "MUST_KNOW", ["Amazon", "Oracle", "Microsoft"], "Understanding this reference, static variables/methods/blocks, and local vs instance variables."],
    ["Stack vs Heap Memory & How Garbage Collection Works", "oop-04-stack-vs-heap-garbage-collection", "OOP Basics & Memory", "IMPORTANT", ["Google", "Oracle", "Amazon"], "Where primitive variables, object references, and actual objects live in memory."],
    ["Constructors (Default, Parameterized, Copy) & Chaining (this() / super())", "oop-05-constructors-and-chaining", "Constructors & Encapsulation", "MUST_KNOW", ["Amazon", "Oracle", "Microsoft"], "How objects are initialized upon creation and constructor vs method differences."],
    ["OOP Pillar 1: Encapsulation & Data Hiding (With BankAccount Example)", "oop-06-encapsulation-data-hiding", "Constructors & Encapsulation", "MUST_KNOW", ["Amazon", "Microsoft", "Adobe"], "Protecting private fields with controlled getters and setters."],
    ["Access Modifiers (public, private, protected, Default) & Packages", "oop-07-access-modifiers-and-packages", "Constructors & Encapsulation", "MUST_KNOW", ["Amazon", "Oracle", "Microsoft"], "Exact visibility rules across classes, subclasses, and packages."],
    ["OOP Pillar 2: Abstraction (Hiding Complexity Behind Simple Interfaces)", "oop-08-abstraction-essentials", "Abstraction, Inheritance & Polymorphism", "MUST_KNOW", ["Amazon", "Microsoft", "Google"], "Showing what an object does while hiding how it works internally."],
    ["OOP Pillar 3: Inheritance (extends, super & Inheritance Types)", "oop-09-inheritance-and-types", "Abstraction, Inheritance & Polymorphism", "MUST_KNOW", ["Amazon", "Oracle", "Microsoft"], "Single, multilevel, hierarchical, multiple & hybrid inheritance, plus final classes/methods."],
    ["Why Java Doesn't Allow Multiple Class Inheritance (The Diamond Problem)", "oop-10-diamond-problem-explained", "Abstraction, Inheritance & Polymorphism", "MUST_KNOW", ["Google", "Amazon", "Meta"], "Visualizing ambiguity in multiple inheritance and how interfaces solve it cleanly."],
    ["OOP Pillar 4: Polymorphism — Method Overloading vs Method Overriding", "oop-11-polymorphism-overloading-vs-overriding", "Abstraction, Inheritance & Polymorphism", "MUST_KNOW", ["Amazon", "Oracle", "Microsoft"], "Compile-time vs runtime polymorphism, @Override, and dynamic method dispatch."],
    ["Abstract Class vs Interface: Clear Comparison & When to Use Each", "oop-12-abstract-class-vs-interface", "Abstraction, Inheritance & Polymorphism", "MUST_KNOW", ["Amazon", "Microsoft", "Goldman Sachs"], "Constructors, fields, default/static interface methods, functional interfaces, and lambdas."],
    ["Shallow Copy vs Deep Copy & Immutable Objects (String)", "oop-13-shallow-vs-deep-copy-immutability", "Object Copying & Contracts", "MUST_KNOW", ["Amazon", "Microsoft", "Goldman Sachs"], "Avoiding accidental shared-reference bugs and building thread-safe immutable classes."],
    ["Object Class Methods: toString(), equals() & hashCode() Contract", "oop-14-equals-hashcode-object-class", "Object Copying & Contracts", "MUST_KNOW", ["Amazon", "Oracle", "Goldman Sachs"], "Why two objects with identical data aren't equal by default and why HashMap needs hashCode()."],
    ["Class Relationships: Association, Aggregation & Composition (Is-A vs Has-A)", "oop-15-association-aggregation-composition", "Class Relationships & UML", "MUST_KNOW", ["Amazon", "Adobe", "Google"], "Weak vs strong ownership and why composition is often safer than inheritance."],
    ["UML Class Diagrams & Designing a Library / Parking Lot System", "oop-16-uml-class-diagrams-basics", "Class Relationships & UML", "IMPORTANT", ["Amazon", "Flipkart", "Uber"], "Reading + / - / # visibility, arrows, and multiplicity (1:1, 1:N, M:N) for LLD interviews."],
    ["SOLID Principles Part 1: Single Responsibility (SRP) & Open/Closed (OCP)", "oop-17-solid-principles-part1-srp-ocp", "SOLID & Clean Code", "MUST_KNOW", ["Amazon", "Microsoft", "Uber"], "Writing modular classes that you can extend without breaking existing code."],
    ["SOLID Principles Part 2: Liskov Substitution, Interface Segregation & Dependency Inversion", "oop-18-solid-principles-part2-lsp-isp-dip", "SOLID & Clean Code", "MUST_KNOW", ["Amazon", "Google", "Stripe"], "Avoiding fragile inheritance and depending on interfaces instead of concrete classes."],
    ["High Cohesion, Low Coupling & Clean Code Rules (DRY, KISS, YAGNI)", "oop-19-coupling-cohesion-dry-kiss", "SOLID & Clean Code", "IMPORTANT", ["Google", "Stripe", "Amazon"], "Practical rules for keeping code readable and easy to change."],
    ["Exception Handling: Exception vs Error, Checked vs Unchecked & try-catch-finally", "oop-20-exception-handling-basics", "Exceptions, Collections & Generics", "MUST_KNOW", ["Amazon", "Oracle", "Goldman Sachs"], "Handling runtime errors gracefully, throw vs throws, try-with-resources, and custom exceptions."],
    ["Java Collections Guide: ArrayList, LinkedList, HashSet, HashMap & PriorityQueue", "oop-21-java-collections-list-set-map", "Exceptions, Collections & Generics", "MUST_KNOW", ["Amazon", "Microsoft", "Flipkart"], "Internal workings, Big-O time complexities, and Comparable vs Comparator."],
    ["Generics (<T>) & String vs StringBuilder vs StringBuffer", "oop-22-generics-and-string-builder", "Exceptions, Collections & Generics", "IMPORTANT", ["Amazon", "Google", "Microsoft"], "Writing type-safe reusable classes and avoiding slow string concatenation in loops."],
    ["Design Patterns Part 1: Singleton (Thread-Safe) & Factory Pattern", "oop-23-singleton-and-factory-patterns", "Design Patterns", "MUST_KNOW", ["Amazon", "Oracle", "Adobe"], "Creating single shared instances and clean object factories."],
    ["Design Patterns Part 2: Builder, Strategy & Observer Patterns", "oop-24-builder-strategy-observer-patterns", "Design Patterns", "MUST_KNOW", ["Amazon", "Flipkart", "Uber"], "Fluent object building, swappable runtime algorithms, and event notifications."],
    ["Design Patterns Part 3: Adapter, Decorator, Facade & Explaining Patterns in Your Project", "oop-25-adapter-decorator-facade-project", "Design Patterns", "IMPORTANT", ["Amazon", "Microsoft", "Stripe"], "Wrapping legacy APIs, simplifying subsystems, and talking about OOP in your resume projects."],
  ]),

  // ── 6. Software Engineering (22) ──────────────────────────────────────────
  ...buildSubject("Software Engineering", [
    ["Program vs Real-World Software & Software Quality Attributes", "se-01-program-vs-software-quality", "SE Basics & SDLC", "MUST_KNOW", ["Amazon", "Microsoft", "TCS"], "Why building production software for thousands of users requires reliability, maintainability, usability & security."],
    ["What is SDLC? The 7 Phases of Building Software Step-by-Step", "se-02-what-is-sdlc-7-phases", "SE Basics & SDLC", "MUST_KNOW", ["Amazon", "TCS", "Infosys"], "Requirements, feasibility, design, coding, testing, deployment, and maintenance explained simply."],
    ["Waterfall Model & V-Model (Sequential Development)", "se-03-waterfall-and-v-model", "SE Basics & SDLC", "MUST_KNOW", ["Amazon", "TCS", "Infosys"], "How traditional step-by-step models work, when they fit, and why rigid phases struggle with changing needs."],
    ["Iterative, Incremental, Prototype & Spiral Models", "se-04-iterative-incremental-prototype-spiral", "SE Basics & SDLC", "MUST_KNOW", ["Amazon", "Microsoft", "Oracle"], "Building in working slices, showing early prototypes to users, and managing project risks with Spiral."],
    ["Agile Mindset & Agile vs Waterfall Explained Simply", "se-05-agile-manifesto-vs-waterfall", "Agile, Scrum & Kanban", "MUST_KNOW", ["Amazon", "Atlassian", "Microsoft"], "Why modern software teams ship small updates every 1-2 weeks instead of waiting 6 months."],
    ["Scrum Framework: Roles, Sprint Events & Artifacts", "se-06-scrum-roles-events-artifacts", "Agile, Scrum & Kanban", "MUST_KNOW", ["Atlassian", "Amazon", "Microsoft"], "Product Owner, Scrum Master, Dev Team; Sprint Planning, Daily Stand-up, Review, Retro; Backlogs & Increment."],
    ["User Stories, Story Points, Velocity, Burndown Charts & Kanban vs Scrum", "se-07-user-stories-story-points-kanban", "Agile, Scrum & Kanban", "IMPORTANT", ["Atlassian", "Microsoft", "Adobe"], "Estimating sprint work and comparing Scrum sprints with continuous-flow Kanban boards."],
    ["Functional vs Non-Functional Requirements & SRS Document", "se-08-functional-vs-non-functional-srs", "Requirements & Design", "MUST_KNOW", ["Amazon", "Microsoft", "Oracle"], "What the app does vs how fast/secure it is, plus writing clear Software Requirements Specifications."],
    ["Feasibility Study, Use Cases & Preventing Scope Creep", "se-09-feasibility-use-cases-scope-creep", "Requirements & Design", "IMPORTANT", ["Amazon", "Atlassian", "Flipkart"], "Technical/economic/operational checks and keeping projects on schedule."],
    ["Software Design Basics: Modularity, High Cohesion & Low Coupling", "se-10-software-design-coupling-cohesion", "Requirements & Design", "MUST_KNOW", ["Amazon", "Google", "Microsoft"], "Breaking big apps into clean, independent modules."],
    ["App Architectures (MVC, Client-Server, Monolith vs Microservices) & UML Overview", "se-11-mvc-monolith-microservices-uml", "Requirements & Design", "MUST_KNOW", ["Amazon", "Uber", "Netflix"], "How Model-View-Controller and modern web architectures organize code."],
    ["Verification vs Validation (Building Right vs Building the Right Thing)", "se-12-verification-vs-validation", "Software Testing", "MUST_KNOW", ["Amazon", "Microsoft", "Adobe"], "Code reviews/static checks vs running real tests on the app."],
    ["Software Testing Basics, Bug Life Cycle & Severity vs Priority", "se-13-testing-basics-bug-severity-priority", "Software Testing", "MUST_KNOW", ["Amazon", "Microsoft", "Adobe"], "Test cases, test suites, debugging vs testing, and high-severity/low-priority examples."],
    ["Testing Levels: Unit, Integration, System, Acceptance (Alpha/Beta), Smoke & Regression", "se-14-testing-levels-unit-to-regression", "Software Testing", "MUST_KNOW", ["Google", "Stripe", "Amazon"], "Testing individual functions first, then connected modules, then full user flows."],
    ["Black-Box vs White-Box Testing, Performance/Load Testing & TDD", "se-15-black-box-vs-white-box-tdd", "Software Testing", "MUST_KNOW", ["Amazon", "Microsoft", "Google"], "Testing without seeing code vs testing internal code paths, plus Test-Driven Development."],
    ["Testing Techniques: Boundary Value Analysis, Equivalence Partitioning & Code Coverage", "se-16-boundary-value-equivalence-coverage", "Software Testing", "IMPORTANT", ["Microsoft", "Amazon", "Adobe"], "Smart ways to pick edge-case test inputs and measure statement/branch coverage."],
    ["Version Control Day 1: Git vs GitHub & Core Commands (init, clone, add, commit, push, status)", "se-17-git-and-github-basics", "Git, CI/CD & Management", "MUST_KNOW", ["Google", "Meta", "Atlassian"], "How developers save code snapshots and collaborate safely in teams."],
    ["Git Branching, Pull Requests, pull vs fetch, merge vs rebase & Merge Conflicts", "se-18-git-branching-pull-vs-fetch-rebase", "Git, CI/CD & Management", "MUST_KNOW", ["Google", "Meta", "Atlassian"], "Working on feature branches and resolving conflicting edits cleanly."],
    ["4 Types of Software Maintenance, Refactoring & Technical Debt", "se-19-software-maintenance-refactoring", "Git, CI/CD & Management", "MUST_KNOW", ["Amazon", "Microsoft", "TCS"], "Corrective, adaptive, perfective & preventive maintenance, plus keeping code clean over time."],
    ["CI/CD Pipelines, Dev/Staging/Production Environments & Docker Basics", "se-20-cicd-staging-production-docker", "Git, CI/CD & Management", "MUST_KNOW", ["Amazon", "Netflix", "Google"], "Automating builds/tests/deployments and packaging apps with containers."],
    ["Project Planning (WBS, Gantt Charts), Risk Management & QA vs QC", "se-21-project-planning-risk-qa-vs-qc", "Git, CI/CD & Management", "IMPORTANT", ["Microsoft", "Atlassian", "TCS"], "Estimating timelines, managing project risks, and Quality Assurance vs Quality Control."],
    ["How to Explain Your Own Project's SDLC, Git Workflow & Testing in Interviews", "se-22-explaining-your-project-sdlc", "Git, CI/CD & Management", "MUST_KNOW", ["Amazon", "Google", "Flipkart"], "Turning your personal/academic projects into a confident engineering story."],
  ]),

  // ── 7. System Design (25) ─────────────────────────────────────────────────
  ...buildSubject("System Design", [
    ["System Design Day 1: What Happens When You Open an App? (Client, Server & DB)", "sd-01-what-is-system-design-client-server", "System Design Foundations", "MUST_KNOW", ["Google", "Amazon", "Microsoft"], "Simple end-to-end picture of how browsers/apps, backend servers, and databases work together."],
    ["HLD vs LLD & Monolithic vs Microservices Architecture", "sd-02-hld-vs-lld-monolith-microservices", "System Design Foundations", "MUST_KNOW", ["Amazon", "Meta", "Uber"], "High-level architecture boxes vs class-level details, and starting with a monolith vs splitting services."],
    ["Scaling Basics: Vertical Scaling vs Horizontal Scaling & Stateless Servers", "sd-03-vertical-vs-horizontal-scaling", "System Design Foundations", "MUST_KNOW", ["Amazon", "Meta", "Uber"], "Upgrading one server's RAM/CPU vs adding more servers, and why stateless APIs make scaling easy."],
    ["Latency vs Throughput, Availability, Redundancy & Single Point of Failure (SPOF)", "sd-04-latency-throughput-availability-spof", "System Design Foundations", "MUST_KNOW", ["Google", "Amazon", "Meta"], "Key system metrics and removing single points of failure so one crash doesn't take down the app."],
    ["Load Balancers (Layer 4 vs Layer 7), Reverse Proxy & Health Checks", "sd-05-what-is-a-load-balancer", "Load Balancing & Caching", "MUST_KNOW", ["Amazon", "Google", "Cloudflare"], "How a traffic cop distributes users across multiple servers and skips crashed servers."],
    ["Load-Balancing Algorithms: Round Robin, Least Connections, Sticky Sessions & Consistent Hashing", "sd-06-load-balancing-algorithms-hashing", "Load Balancing & Caching", "MUST_KNOW", ["Amazon", "Discord", "Uber"], "Fair traffic routing rules and why Consistent Hashing minimizes cache reshuffling."],
    ["Caching Basics: Cache Hit vs Miss, Redis & Eviction Policies (LRU, LFU, FIFO)", "sd-07-what-is-caching-hit-miss-redis", "Load Balancing & Caching", "MUST_KNOW", ["Amazon", "Meta", "Netflix"], "Keeping hot data in fast RAM (Redis/Memcached) instead of hitting the database every time."],
    ["Caching Strategies (Cache-Aside, Write-Through, Write-Behind) & Cache Invalidation", "sd-08-caching-strategies-invalidation", "Load Balancing & Caching", "MUST_KNOW", ["Amazon", "Meta", "Cloudflare"], "Keeping cached data fresh, avoiding stale reads, and preventing cache stampedes."],
    ["CDNs (Content Delivery Networks) & Multi-Layer Caching", "sd-09-cdn-and-edge-caching", "Load Balancing & Caching", "MUST_KNOW", ["Netflix", "Cloudflare", "Meta"], "Serving images, videos, and static files from servers closest to the user."],
    ["Choosing the Right Database at Scale: SQL vs NoSQL (Document, Key-Value, Column, Graph)", "sd-10-sql-vs-nosql-at-scale", "Databases & Async Systems", "MUST_KNOW", ["Amazon", "Google", "Meta"], "Matching real app features to PostgreSQL, MongoDB, Redis, Cassandra, or Neo4j."],
    ["Database Replication: Primary-Replica & Read Replicas (Sync vs Async)", "sd-11-database-replication-read-replicas", "Databases & Async Systems", "MUST_KNOW", ["Amazon", "Meta", "Uber"], "Scaling read-heavy apps by copying data to replica databases and handling failover."],
    ["Database Sharding & Partitioning (Range, Hash, Geographic & Hot Spots)", "sd-12-database-sharding-partitioning", "Databases & Async Systems", "MUST_KNOW", ["Meta", "Amazon", "Twitter"], "Splitting huge tables across multiple database machines when one DB gets too big."],
    ["Message Queues & Async Processing (Kafka, RabbitMQ, SQS & Pub/Sub)", "sd-13-message-queues-async-processing", "Databases & Async Systems", "MUST_KNOW", ["Uber", "LinkedIn", "Amazon"], "Offloading slow background tasks (emails, notifications, video encoding) so APIs respond instantly."],
    ["Idempotency, Safe Retries & Dead-Letter Queues (DLQ)", "sd-14-idempotency-retries-dlq", "Databases & Async Systems", "IMPORTANT", ["Stripe", "Uber", "Amazon"], "Ensuring network retries never create duplicate payments or orders."],
    ["Designing Clean REST APIs: Versioning, Pagination & Rate Limiting", "sd-15-rest-api-versioning-pagination", "APIs, Storage & Distributed Core", "MUST_KNOW", ["Amazon", "Stripe", "Cloudflare"], "Protecting APIs from overload (Token Bucket / Sliding Window) and paginating large lists."],
    ["API Gateway, Auth (JWT/OAuth) & Real-Time Communication (WebSockets vs Long Polling vs gRPC)", "sd-16-api-gateway-auth-websockets-grpc", "APIs, Storage & Distributed Core", "MUST_KNOW", ["Discord", "Google", "Meta"], "Routing requests through an API Gateway and building real-time features."],
    ["Storing Images & Videos (AWS S3, Pre-Signed URLs) & Full-Text Search (Elasticsearch)", "sd-17-object-storage-s3-and-search", "APIs, Storage & Distributed Core", "MUST_KNOW", ["Amazon", "Netflix", "Google"], "Why media files go in object storage instead of SQL databases, plus search engine basics."],
    ["CAP Theorem (CP vs AP), Strong vs Eventual Consistency & Quorums", "sd-18-cap-theorem-consistency-quorum", "APIs, Storage & Distributed Core", "MUST_KNOW", ["Amazon", "Google", "Meta"], "Distributed trade-offs during network partitions and why social media likes use eventual consistency."],
    ["The 5-Step System Design Interview Blueprint & Scale Estimation (QPS & Storage)", "sd-19-5-step-system-design-framework", "Classic HLD Case Studies", "MUST_KNOW", ["Google", "Meta", "Amazon"], "A simple checklist for answering any HLD question: Requirements -> Estimation -> Diagram -> Deep Dive -> Trade-offs."],
    ["Case Study 1: Design a URL Shortener (TinyURL)", "sd-20-case-study-url-shortener", "Classic HLD Case Studies", "MUST_KNOW", ["Amazon", "Google", "Meta"], "Base62 short codes, database schema, Redis caching, and 301 vs 302 redirects."],
    ["Case Study 2: Design an API Rate Limiter", "sd-21-case-study-rate-limiter", "Classic HLD Case Studies", "MUST_KNOW", ["Stripe", "Cloudflare", "Amazon"], "Token Bucket vs Sliding Window algorithms using Redis counters."],
    ["Case Study 3: Design a Scalable Notification System (Push, SMS & Email)", "sd-22-case-study-notification-system", "Classic HLD Case Studies", "MUST_KNOW", ["Amazon", "Uber", "Google"], "Message queues, worker pools, retries, and Dead-Letter Queues for high-volume alerts."],
    ["Case Study 4: Design a Real-Time Chat Application (1-on-1 & Group Chat)", "sd-23-case-study-chat-application", "Classic HLD Case Studies", "IMPORTANT", ["Meta", "Discord", "Amazon"], "WebSockets, online presence, message storage, and offline delivery queues."],
    ["Case Study 5: Social Media Feed (Instagram/Twitter) & Ticket Booking (BookMyShow)", "sd-24-case-study-social-feed-booking", "Classic HLD Case Studies", "IMPORTANT", ["Meta", "Flipkart", "Amazon"], "Fan-out push/pull timelines and preventing double-booking seats with temporary locks."],
    ["Case Study 6: Real-Time Leaderboard & Explaining Your Own Project Architecture", "sd-25-case-study-leaderboard-your-project", "Classic HLD Case Studies", "MUST_KNOW", ["Amazon", "Google", "Meta"], "Redis Sorted Sets and presenting your full-stack project cleanly in interviews."],
  ]),

  // ── 8. Behavioral & HR (45) ───────────────────────────────────────────────
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
