import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function fetchAllRows(tableName, columns = '*', options = {}) {
  const pageSize = options.pageSize ?? 1000
  const queryBuilder = options.queryBuilder
  const onProgress = options.onProgress

  let from = 0
  let totalCount = null
  const rows = []

  while (true) {
    let query = supabase
      .from(tableName)
      .select(columns, totalCount == null ? { count: 'exact' } : undefined)
      .range(from, from + pageSize - 1)

    if (typeof queryBuilder === 'function') {
      query = queryBuilder(query)
    }

    const { data, error, count } = await query

    if (error) {
      throw error
    }

    const batch = Array.isArray(data) ? data : []
    rows.push(...batch)

    if (totalCount == null) {
      totalCount = count ?? null
    }

    onProgress?.({
      loaded: rows.length,
      total: totalCount,
      batchSize: batch.length,
    })

    if (!batch.length) {
      break
    }

    if (totalCount != null && rows.length >= totalCount) {
      break
    }

    if (batch.length < pageSize) {
      break
    }

    from += pageSize
  }

  return {
    data: rows,
    count: totalCount ?? rows.length,
  }
}
