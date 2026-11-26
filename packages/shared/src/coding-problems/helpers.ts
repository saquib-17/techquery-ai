import type { CuratedTestCase } from "../coding.js";

export function tc(
  cases: Array<[stdin: string, expectedOutput: string]>
): CuratedTestCase[] {
  return cases.map(([stdin, expectedOutput], idx) => ({
    id: idx < 3 ? `sample-${idx + 1}` : `hidden-${idx - 2}`,
    stdin,
    expectedOutput,
    isHidden: idx >= 3,
  }));
}

export const LIST_NODE_DEF = {
  java: `class ListNode {
  int val;
  ListNode next;
  ListNode() {}
  ListNode(int val) { this.val = val; }
  ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}`,
  python: `class ListNode:
  def __init__(self, val=0, next=None):
    self.val = val
    self.next = next`,
  cpp: `struct ListNode {
  int val;
  ListNode *next;
  ListNode() : val(0), next(nullptr) {}
  ListNode(int x) : val(x), next(nullptr) {}
  ListNode(int x, ListNode *next) : val(x), next(next) {}
};`,
  javascript: `function ListNode(val, next) {
  this.val = (val === undefined ? 0 : val);
  this.next = (next === undefined ? null : next);
}`,
};

export const LIST_NODE_HELPERS = {
  java: `static ListNode parseList(String line) {
    String t = line.trim();
    if (t.length() <= 2) return null;
    String[] parts = t.substring(1, t.length() - 1).split(",");
    ListNode dummy = new ListNode(0), cur = dummy;
    for (String p : parts) {
      String s = p.trim();
      if (!s.isEmpty()) { cur.next = new ListNode(Integer.parseInt(s)); cur = cur.next; }
    }
    return dummy.next;
  }
  static String serializeList(ListNode head) {
    StringBuilder sb = new StringBuilder("[");
    boolean first = true;
    while (head != null) {
      if (!first) sb.append(",");
      sb.append(head.val);
      first = false;
      head = head.next;
    }
    sb.append("]");
    return sb.toString();
  }`,
  python: `def parse_list(line):
  arr = json.loads(line.strip()) if line.strip() else []
  dummy = ListNode(0)
  cur = dummy
  for v in arr:
    cur.next = ListNode(v)
    cur = cur.next
  return dummy.next

def serialize_list(head):
  out = []
  while head:
    out.append(head.val)
    head = head.next
  return json.dumps(out, separators=(",", ":"))`,
  cpp: `ListNode* parseList(const string& line) {
  string t = line;
  if (t.size() <= 2) return nullptr;
  ListNode dummy(0);
  ListNode* cur = &dummy;
  size_t i = 1;
  while (i < t.size() - 1) {
    while (i < t.size() - 1 && (t[i] == ' ' || t[i] == ',')) i++;
    if (i >= t.size() - 1) break;
    size_t j = i;
    while (j < t.size() - 1 && t[j] != ',') j++;
    cur->next = new ListNode(stoi(t.substr(i, j - i)));
    cur = cur->next;
    i = j + 1;
  }
  return dummy.next;
}
string serializeList(ListNode* head) {
  string out = "[";
  bool first = true;
  while (head) {
    if (!first) out += ",";
    out += to_string(head->val);
    first = false;
    head = head->next;
  }
  out += "]";
  return out;
}`,
  javascript: `function parseList(line) {
  const arr = JSON.parse((line || "[]").trim() || "[]");
  const dummy = new ListNode(0);
  let cur = dummy;
  for (const v of arr) {
    cur.next = new ListNode(v);
    cur = cur.next;
  }
  return dummy.next;
}
function serializeList(head) {
  const out = [];
  while (head) { out.push(head.val); head = head.next; }
  return JSON.stringify(out);
}`,
};

export const TREE_NODE_DEF = {
  java: `class TreeNode {
  int val;
  TreeNode left;
  TreeNode right;
  TreeNode() {}
  TreeNode(int val) { this.val = val; }
  TreeNode(int val, TreeNode left, TreeNode right) {
    this.val = val; this.left = left; this.right = right;
  }
}`,
  python: `class TreeNode:
  def __init__(self, val=0, left=None, right=None):
    self.val = val
    self.left = left
    self.right = right`,
  cpp: `struct TreeNode {
  int val;
  TreeNode *left;
  TreeNode *right;
  TreeNode() : val(0), left(nullptr), right(nullptr) {}
  TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
  TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
};`,
  javascript: `function TreeNode(val, left, right) {
  this.val = (val === undefined ? 0 : val);
  this.left = (left === undefined ? null : left);
  this.right = (right === undefined ? null : right);
}`,
};

export const TREE_NODE_HELPERS = {
  java: `static TreeNode parseTree(String line) {
    String t = line.trim();
    if (t.length() <= 2) return null;
    String[] parts = t.substring(1, t.length() - 1).split(",");
    if (parts.length == 0 || parts[0].trim().isEmpty() || parts[0].trim().equals("null")) return null;
    TreeNode root = new TreeNode(Integer.parseInt(parts[0].trim()));
    Queue<TreeNode> q = new LinkedList<>();
    q.offer(root);
    int i = 1;
    while (!q.isEmpty() && i < parts.length) {
      TreeNode cur = q.poll();
      if (i < parts.length) {
        String s = parts[i++].trim();
        if (!s.equals("null") && !s.isEmpty()) {
          cur.left = new TreeNode(Integer.parseInt(s));
          q.offer(cur.left);
        }
      }
      if (i < parts.length) {
        String s = parts[i++].trim();
        if (!s.equals("null") && !s.isEmpty()) {
          cur.right = new TreeNode(Integer.parseInt(s));
          q.offer(cur.right);
        }
      }
    }
    return root;
  }
  static String serializeTree(TreeNode root) {
    if (root == null) return "[]";
    List<String> res = new ArrayList<>();
    Queue<TreeNode> q = new LinkedList<>();
    q.offer(root);
    while (!q.isEmpty()) {
      TreeNode cur = q.poll();
      if (cur == null) { res.add("null"); continue; }
      res.add(String.valueOf(cur.val));
      q.offer(cur.left);
      q.offer(cur.right);
    }
    while (!res.isEmpty() && res.get(res.size() - 1).equals("null")) res.remove(res.size() - 1);
    return "[" + String.join(",", res) + "]";
  }`,
  python: `def parse_tree(line):
  arr = json.loads(line.strip()) if line.strip() else []
  if not arr or arr[0] is None:
    return None
  root = TreeNode(arr[0])
  q = collections.deque([root])
  i = 1
  while q and i < len(arr):
    cur = q.popleft()
    if i < len(arr) and arr[i] is not None:
      cur.left = TreeNode(arr[i])
      q.append(cur.left)
    i += 1
    if i < len(arr) and arr[i] is not None:
      cur.right = TreeNode(arr[i])
      q.append(cur.right)
    i += 1
  return root

def serialize_tree(root):
  if not root:
    return "[]"
  out = []
  q = collections.deque([root])
  while q:
    cur = q.popleft()
    if cur is None:
      out.append(None)
    else:
      out.append(cur.val)
      q.append(cur.left)
      q.append(cur.right)
  while out and out[-1] is None:
    out.pop()
  return json.dumps(out, separators=(",", ":"))`,
  cpp: `TreeNode* parseTree(const string& line) {
  string t = line;
  if (t.size() <= 2) return nullptr;
  vector<string> parts;
  size_t i = 1;
  while (i < t.size() - 1) {
    size_t j = t.find(',', i);
    if (j == string::npos || j >= t.size() - 1) j = t.size() - 1;
    string s = t.substr(i, j - i);
    size_t a = s.find_first_not_of(" \\t"), b = s.find_last_not_of(" \\t");
    parts.push_back(a == string::npos ? "" : s.substr(a, b - a + 1));
    i = j + 1;
  }
  if (parts.empty() || parts[0].empty() || parts[0] == "null") return nullptr;
  TreeNode* root = new TreeNode(stoi(parts[0]));
  queue<TreeNode*> q;
  q.push(root);
  size_t idx = 1;
  while (!q.empty() && idx < parts.size()) {
    TreeNode* cur = q.front(); q.pop();
    if (idx < parts.size()) {
      string s = parts[idx++];
      if (!s.empty() && s != "null") { cur->left = new TreeNode(stoi(s)); q.push(cur->left); }
    }
    if (idx < parts.size()) {
      string s = parts[idx++];
      if (!s.empty() && s != "null") { cur->right = new TreeNode(stoi(s)); q.push(cur->right); }
    }
  }
  return root;
}
string serializeTree(TreeNode* root) {
  if (!root) return "[]";
  vector<string> res;
  queue<TreeNode*> q;
  q.push(root);
  while (!q.empty()) {
    TreeNode* cur = q.front(); q.pop();
    if (!cur) { res.push_back("null"); continue; }
    res.push_back(to_string(cur->val));
    q.push(cur->left);
    q.push(cur->right);
  }
  while (!res.empty() && res.back() == "null") res.pop_back();
  string out = "[";
  for (size_t i = 0; i < res.size(); i++) { if (i) out += ","; out += res[i]; }
  return out + "]";
}`,
  javascript: `function parseTree(line) {
  const arr = JSON.parse((line || "[]").trim() || "[]");
  if (!arr.length || arr[0] === null) return null;
  const root = new TreeNode(arr[0]);
  const q = [root];
  let i = 1;
  while (q.length && i < arr.length) {
    const cur = q.shift();
    if (i < arr.length && arr[i] !== null) {
      cur.left = new TreeNode(arr[i]);
      q.push(cur.left);
    }
    i++;
    if (i < arr.length && arr[i] !== null) {
      cur.right = new TreeNode(arr[i]);
      q.push(cur.right);
    }
    i++;
  }
  return root;
}
function serializeTree(root) {
  if (!root) return "[]";
  const out = [];
  const q = [root];
  while (q.length) {
    const cur = q.shift();
    if (!cur) { out.push(null); continue; }
    out.push(cur.val);
    q.push(cur.left);
    q.push(cur.right);
  }
  while (out.length && out[out.length - 1] === null) out.pop();
  return JSON.stringify(out);
}`,
};
