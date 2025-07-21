import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import "@brightspace-ui/core/components/inputs/input-search.js";
import "@brightspace-ui/core/components/loading-spinner/loading-spinner.js";
import "@brightspace-ui/core/components/alert/alert.js";
import "@brightspace-ui/core/components/link/link.js";
import "@brightspace-ui/core/components/button/button.js";
import "@brightspace-ui/core/components/breadcrumbs/breadcrumbs.js";
import "@brightspace-ui/core/components/paging/pager-load-more.js";
import "../components/pageable-wrapper";

import { getLtik } from "../utils/helper";
import axios from "axios";
import { Router } from "@vaadin/router";

interface StoredImageItem {
  _id: string;
  mayoImageId: string;
  mayoImageTitle: string;
  mayoThumbnailUrl: string;
  mayoFullImageUrl: string;
  d2lImageUrl: string;
  d2lOrgUnitId: string;
  insertedBy: string;
  insertedAt: string;
  altText: string;
  isDecorative: boolean;
  title: string;
  usageCount: number;
  lastUsed: string;
  status: string;
}

@customElement("stored-images-page")
export class StoredImagesPage extends LitElement {
  static styles = css`
    :host {
      width: 100vw;
      height: 100vh;
      padding: 1rem;
    }
    .page-header {
      margin-bottom: 1rem;
    }
    .page-title {
      margin-top: 0;
      margin-bottom: 1rem;
      font-weight: normal;
    }
    .search-container {
      margin-bottom: 1rem;
    }
    .images-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
      margin-bottom: 1rem;
    }
    .image-card {
      border: 1px solid #d3d9e3;
      border-radius: 8px;
      padding: 1rem;
      background: white;
      transition: box-shadow 0.2s ease;
    }
    .image-card:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .image-preview {
      width: 100%;
      height: 150px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      border-radius: 4px;
      background: #f9f9f9;
      margin-bottom: 0.5rem;
    }
    .image-preview img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
    .image-title {
      font-weight: 600;
      margin-bottom: 0.5rem;
      font-size: 0.9rem;
      line-height: 1.3;
    }
    .image-meta {
      font-size: 0.8rem;
      color: #666;
      margin-bottom: 0.5rem;
    }
    .image-stats {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      color: #888;
      margin-bottom: 0.5rem;
    }
    .image-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }
    .spinner-container {
      height: 60vh;
      width: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .empty-state {
      text-align: center;
      padding: 2rem;
      color: #666;
    }
    .filter-tabs {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .filter-tab {
      padding: 0.5rem 1rem;
      border: 1px solid #d3d9e3;
      background: white;
      cursor: pointer;
      border-radius: 4px;
      transition: all 0.2s ease;
    }
    .filter-tab.active {
      background: #006fbf;
      color: white;
      border-color: #006fbf;
    }
    .filter-tab:hover:not(.active) {
      background: #f5f5f5;
    }
  `;

  @state() private searchTerm = "";
  @state() private results: StoredImageItem[] = [];
  @state() private loading = false;
  @state() private ltik: string | null = null;
  @state() private orgUnitId: string | null = null;
  @state() private currentFilter: 'all' | 'my-images' = 'all';

  firstUpdated() {
    this.ltik = getLtik();
    // Extract orgUnitId from URL params or context
    const urlParams = new URLSearchParams(window.location.search);
    this.orgUnitId = urlParams.get('orgUnitId');
    
    if (this.orgUnitId) {
      this.loadStoredImages();
    }
  }

  private async loadStoredImages() {
    if (!this.orgUnitId) return;
    
    this.loading = true;
    try {
      const params: any = { limit: 50 };
      
      if (this.searchTerm.trim()) {
        params.search = this.searchTerm;
      }
      
      if (this.currentFilter === 'my-images') {
        // You would need to get the current user ID from context
        // params.userId = getCurrentUserId();
      }

      const res = await axios.get(`/api/image-storage/org/${this.orgUnitId}/images`, {
        params,
        headers: { Authorization: `Bearer ${this.ltik}` },
      });
      
      this.results = res.data.data || [];
    } catch (err) {
      console.error("Error loading stored images:", err);
      this.results = [];
    } finally {
      this.loading = false;
    }
  }

  private async _triggerSearch() {
    await this.loadStoredImages();
  }

  private _selectStoredImage(image: StoredImageItem) {
    // Convert stored image back to ImageItem format for compatibility
    const imageItem = {
      id: image.mayoImageId,
      name: image.mayoImageTitle,
      thumbnailUrl: image.mayoThumbnailUrl,
      fullImageUrl: image.d2lImageUrl, // Use D2L URL instead of Mayo URL
      imageWidth: undefined,
      imageHeight: undefined,
      createDate: image.insertedAt,
    };
    
    if (sessionStorage.getItem("selectedImage")) {
      sessionStorage.removeItem("selectedImage");
    }
    sessionStorage.setItem("selectedImage", JSON.stringify(imageItem));
    Router.go(`/details?ltik=${this.ltik}`);
  }

  private goToSearch() {
    Router.go(`/deeplink?ltik=${this.ltik}`);
  }

  private setFilter(filter: 'all' | 'my-images') {
    this.currentFilter = filter;
    this.loadStoredImages();
  }

  private formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  render() {
    return html`
      <div class="page-header">
        <d2l-breadcrumbs>
          <d2l-breadcrumb
            href="#"
            text="Search Mayo Images"
            @click=${this.goToSearch}
            style="cursor:pointer;"
          ></d2l-breadcrumb>
          <d2l-breadcrumb text="Stored D2L Images"></d2l-breadcrumb>
        </d2l-breadcrumbs>
        
        <h4 class="page-title">Previously Inserted Images</h4>
        
        <div class="filter-tabs">
          <div 
            class="filter-tab ${this.currentFilter === 'all' ? 'active' : ''}"
            @click=${() => this.setFilter('all')}
          >
            All Images
          </div>
          <div 
            class="filter-tab ${this.currentFilter === 'my-images' ? 'active' : ''}"
            @click=${() => this.setFilter('my-images')}
          >
            My Images
          </div>
        </div>
        
        <div class="search-container">
          <d2l-input-search
            label="Search stored images"
            placeholder="Search by title, alt text, or tags..."
            .value=${this.searchTerm}
            @d2l-input-search-searched=${(e: any) => {
              this.searchTerm = e.detail.value;
              this._triggerSearch();
            }}
            @input=${(e: any) => (this.searchTerm = e.target.value)}
            @keydown=${(e: KeyboardEvent) =>
              e.key === "Enter" && this._triggerSearch()}
            @clear=${() => {
              this.searchTerm = "";
              this.loadStoredImages();
            }}
          ></d2l-input-search>
        </div>
      </div>

      ${this.loading
        ? html`
            <div class="spinner-container">
              <d2l-loading-spinner size="100"></d2l-loading-spinner>
            </div>
          `
        : this.results.length === 0
        ? html`
            <div class="empty-state">
              <p>No stored images found.</p>
              <d2l-button @click=${this.goToSearch}>
                Search Mayo Images
              </d2l-button>
            </div>
          `
        : html`
            <div class="images-grid">
              ${this.results.map(
                (image) => html`
                  <div class="image-card">
                    <div class="image-preview">
                      <img
                        src=${image.d2lImageUrl}
                        alt=${image.altText || image.mayoImageTitle}
                        crossorigin="anonymous"
                        @error=${(e: any) => {
                          // Fallback to Mayo thumbnail if D2L image fails
                          e.target.src = image.mayoThumbnailUrl;
                        }}
                      />
                    </div>
                    
                    <div class="image-title">${image.mayoImageTitle}</div>
                    
                    <div class="image-meta">
                      ${image.isDecorative 
                        ? 'Decorative image' 
                        : `Alt: ${image.altText || 'No alt text'}`}
                    </div>
                    
                    <div class="image-stats">
                      <span>Used ${image.usageCount} times</span>
                      <span>Added ${this.formatDate(image.insertedAt)}</span>
                    </div>
                    
                    <div class="image-actions">
                      <d2l-button 
                        @click=${() => this._selectStoredImage(image)}
                        primary
                        size="small"
                      >
                        Use Image
                      </d2l-button>
                      <d2l-button 
                        @click=${() => window.open(image.d2lImageUrl, '_blank')}
                        secondary
                        size="small"
                      >
                        View Full
                      </d2l-button>
                    </div>
                  </div>
                `
              )}
            </div>
          `}
    `;
  }
}
