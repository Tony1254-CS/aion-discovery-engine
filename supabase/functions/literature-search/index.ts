import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Paper {
  id: string;
  title: string;
  authors: string;
  abstract: string;
  source: string;
  relevance: number;
  date: string;
  url: string;
}

async function searchArxiv(query: string, maxResults = 8): Promise<Paper[]> {
  const encodedQuery = encodeURIComponent(query);
  const url = `http://export.arxiv.org/api/query?search_query=all:${encodedQuery}&start=0&max_results=${maxResults}&sortBy=submittedDate&sortOrder=descending`;

  const response = await fetch(url);
  if (!response.ok) {
    console.error("ArXiv API error:", response.status);
    return [];
  }

  const xml = await response.text();
  const papers: Paper[] = [];

  // Parse entries from Atom XML
  const entries = xml.split("<entry>").slice(1);
  for (const entry of entries) {
    const getTag = (tag: string): string => {
      const match = entry.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
      return match ? match[1].trim() : "";
    };

    const title = getTag("title").replace(/\s+/g, " ");
    const abstract = getTag("summary").replace(/\s+/g, " ");
    const published = getTag("published").slice(0, 10);

    // Extract authors
    const authorMatches = [...entry.matchAll(/<author>\s*<name>([^<]+)<\/name>/g)];
    const authorNames = authorMatches.map(m => m[1].trim());
    let authors = "";
    if (authorNames.length === 0) authors = "Unknown";
    else if (authorNames.length === 1) authors = authorNames[0];
    else if (authorNames.length === 2) authors = authorNames.join(" & ");
    else authors = `${authorNames[0]} et al.`;

    // Extract arxiv ID for URL
    const idMatch = entry.match(/<id>([^<]+)<\/id>/);
    const arxivUrl = idMatch ? idMatch[1].trim() : "#";

    // Extract primary category
    const catMatch = entry.match(/term="([^"]+)"/);
    const category = catMatch ? catMatch[1] : "arxiv";

    if (title) {
      papers.push({
        id: `arxiv-${papers.length}-${Date.now()}`,
        title,
        authors,
        abstract: abstract.length > 300 ? abstract.slice(0, 297) + "..." : abstract,
        source: `ArXiv [${category}]`,
        relevance: 0, // computed later
        date: published,
        url: arxivUrl,
      });
    }
  }

  return papers;
}

async function searchPubMed(query: string, maxResults = 5): Promise<Paper[]> {
  // Step 1: search for IDs
  const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${maxResults}&sort=date&retmode=json`;

  const searchRes = await fetch(searchUrl);
  if (!searchRes.ok) {
    console.error("PubMed search error:", searchRes.status);
    return [];
  }

  const searchData = await searchRes.json();
  const ids: string[] = searchData?.esearchresult?.idlist || [];
  if (ids.length === 0) return [];

  // Step 2: fetch details
  const fetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(",")}&retmode=json`;
  const fetchRes = await fetch(fetchUrl);
  if (!fetchRes.ok) {
    console.error("PubMed fetch error:", fetchRes.status);
    return [];
  }

  const fetchData = await fetchRes.json();
  const papers: Paper[] = [];

  for (const id of ids) {
    const article = fetchData?.result?.[id];
    if (!article || article.error) continue;

    const title = article.title || "Untitled";
    const authorList = article.authors || [];
    let authors = "Unknown";
    if (authorList.length === 1) authors = authorList[0].name;
    else if (authorList.length === 2) authors = `${authorList[0].name} & ${authorList[1].name}`;
    else if (authorList.length > 2) authors = `${authorList[0].name} et al.`;

    const journal = article.fulljournalname || article.source || "PubMed";
    const pubDate = article.pubdate || "";
    const doi = article.elocationid?.replace("doi: ", "") || "";

    papers.push({
      id: `pubmed-${id}`,
      title: title.replace(/<\/?[^>]+>/g, ""),
      authors,
      abstract: `Published in ${journal}. ${article.sorttitle || ""}`.trim(),
      source: journal,
      relevance: 0,
      date: pubDate,
      url: doi ? `https://doi.org/${doi}` : `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
    });
  }

  return papers;
}

function computeRelevance(paper: Paper, queryTerms: string[]): number {
  const text = `${paper.title} ${paper.abstract}`.toLowerCase();
  let matches = 0;
  for (const term of queryTerms) {
    if (text.includes(term.toLowerCase())) matches++;
  }
  const ratio = queryTerms.length > 0 ? matches / queryTerms.length : 0;
  // Scale 50-99 based on match ratio
  return Math.min(99, Math.round(50 + ratio * 49));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string") {
      return new Response(JSON.stringify({ error: "query is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch from both sources in parallel
    const [arxivPapers, pubmedPapers] = await Promise.all([
      searchArxiv(query, 8),
      searchPubMed(query, 5),
    ]);

    const queryTerms = query.toLowerCase().split(/\s+/).filter((w: string) => w.length > 2);
    const allPapers = [...arxivPapers, ...pubmedPapers];

    // Compute relevance scores
    for (const paper of allPapers) {
      paper.relevance = computeRelevance(paper, queryTerms);
    }

    // Sort by relevance descending
    allPapers.sort((a, b) => b.relevance - a.relevance);

    return new Response(JSON.stringify({ papers: allPapers }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("literature-search error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
