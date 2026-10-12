"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { NewsCard } from "@/components/news/news-card";
import type { NewsArticle } from "@/config/news-data";

export interface NewsGridProps {
  articles: NewsArticle[];
}

const ITEMS_PER_PAGE = 6;

export function NewsGrid({ articles }: NewsGridProps) {
  const [selectedCategory, setSelectedCategory] = React.useState("all");
  const [currentPage, setCurrentPage] = React.useState(1);

  // Filter computation by category
  const filteredArticles = React.useMemo(() => {
    if (selectedCategory === "all") {
      return articles;
    }
    return articles.filter((article) => article.type === selectedCategory);
  }, [articles, selectedCategory]);

  const handleCategoryChange = (val: string) => {
    setSelectedCategory(val);
    setCurrentPage(1);
  };

  // Pagination slice
  const totalPages = Math.ceil(filteredArticles.length / ITEMS_PER_PAGE) || 1;
  const paginatedArticles = filteredArticles.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div>
      {/* Top Controls Bar: Clean Category Select on Upper Right */}
      <div className="flex items-center justify-between mb-8 pb-3 border-b border-gray-200/80 flex-wrap gap-4">
        <span className="text-xs text-slate-500 font-medium">
          Showing{" "}
          <strong className="text-gov-charcoal font-bold">
            {filteredArticles.length}
          </strong>{" "}
          {filteredArticles.length === 1 ? "publication" : "publications"}
        </span>

        {/* Minimalist Category Select Dropdown */}
        <div className="flex items-center gap-2">
          <label htmlFor="news-category-select" className="sr-only">
            Select Category
          </label>
          <div className="relative">
            <select
              id="news-category-select"
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="appearance-none pl-3.5 pr-8 py-1.5 text-xs sm:text-sm bg-white border border-gray-300 hover:border-burgundy-700/80 rounded-xs text-gov-charcoal font-bold shadow-2xs focus:outline-none focus:ring-2 focus:ring-burgundy-700 transition-colors cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="news">News</option>
              <option value="announcement">Announcements</option>
              <option value="advisory">Advisories</option>
              <option value="notice">Public Notices</option>
            </select>
            {/* Custom dropdown arrow indicator */}
            <div
              className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500"
              aria-hidden="true"
            >
              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 3-Column Open Editorial News Grid */}
      {paginatedArticles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {paginatedArticles.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="py-16 text-center space-y-3">
          <p className="text-sm text-slate-500">
            No publications found in this category.
          </p>
          <button
            type="button"
            onClick={() => handleCategoryChange("all")}
            className="text-xs font-bold text-burgundy-700 hover:text-burgundy-900 hover:underline"
          >
            Show all publications
          </button>
        </div>
      )}

      {/* Simple Restrained Pagination */}
      {totalPages > 1 && (
        <nav
          aria-label="News Pagination"
          className="mt-14 pt-8 border-t border-gray-200 flex items-center justify-center gap-2"
        >
          {/* Previous Button */}
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-burgundy-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Go to previous page"
          >
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Previous</span>
          </button>

          {/* Page Indicators */}
          <div className="flex items-center gap-1 mx-2">
            {Array.from({ length: totalPages }).map((_, idx) => {
              const pageNumber = idx + 1;
              const isCurrent = pageNumber === currentPage;

              return (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setCurrentPage(pageNumber)}
                  aria-current={isCurrent ? "page" : undefined}
                  className={`min-w-8 h-8 px-2 rounded-xs text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700 ${
                    isCurrent
                      ? "bg-burgundy-800 text-white shadow-2xs"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}
          </div>

          {/* Next Button */}
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-burgundy-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Go to next page"
          >
            <span>Next</span>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </nav>
      )}
    </div>
  );
}
