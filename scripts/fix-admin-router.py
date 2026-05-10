"""
Fix: merge the duplicate 'admin' router into the first one.
The second admin: router({...}) at the end of routers.ts overwrites the first,
causing all admin procedures to return 404.
"""

with open('server/routers.ts', 'r') as f:
    content = f.read()

# ── 1. Find the first admin router closing marker ────────────────────────────
# The first admin router ends with:  }),\n  // Mercadona integrationn
first_admin_close_marker = "      }),\n  }),\n  // Mercadona integrationn"
first_close_pos = content.find(first_admin_close_marker)
if first_close_pos == -1:
    print("ERROR: First admin router closing marker not found")
    exit(1)
print(f"First admin router closes at position {first_close_pos}")

# ── 2. Extract the tagKidFriendlyRecipes procedure from the second admin router ──
second_admin_block_start = content.find(
    "  // ---------------------------------------------------------------------------\n"
    "  // ADMIN: Etiquetado de recetas para niños con IA\n"
    "  // ---------------------------------------------------------------------------\n"
    "  admin: router({"
)
if second_admin_block_start == -1:
    print("ERROR: Second admin block not found")
    exit(1)
print(f"Second admin block starts at position {second_admin_block_start}")

# The procedure content is between "admin: router({" and the closing "}),\n});"
end_marker = "\n});\nexport type AppRouter = typeof appRouter;"
end_pos = content.find(end_marker)
if end_pos == -1:
    print("ERROR: End marker not found")
    exit(1)

# Extract the tagKidFriendlyRecipes procedure body
proc_start_marker = "    tagKidFriendlyRecipes: protectedProcedure"
proc_start = content.find(proc_start_marker, second_admin_block_start)
# The procedure ends at the closing of the second admin router
# Find "      }),\n  })," after proc_start
proc_end_marker = "      }),\n  }),"
proc_end = content.find(proc_end_marker, proc_start)
if proc_end == -1:
    print("ERROR: Procedure end not found")
    exit(1)
proc_content = content[proc_start:proc_end + len("      }),")]
print(f"Extracted procedure ({len(proc_content)} chars)")

# ── 3. Build the new content ─────────────────────────────────────────────────
# Insert tagKidFriendlyRecipes before the first admin router closing
insert_point = first_close_pos + len("      }),")  # after the last procedure's closing
# The actual close is "      }),\n  })," — we insert before "  }),"
insert_at = first_close_pos + len("      }),\n")

new_content = (
    content[:insert_at]
    + proc_content + "\n"
    + content[insert_at:second_admin_block_start]
    + content[end_pos:]
)

# ── 4. Write back ─────────────────────────────────────────────────────────────
with open('server/routers.ts', 'w') as f:
    f.write(new_content)

print("Done! Merged tagKidFriendlyRecipes into the first admin router.")
print(f"Original length: {len(content)}, New length: {len(new_content)}")
