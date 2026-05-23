import { useEffect, useState } from 'react'
import { ListIcon, EyeIcon, EyeSlashIcon } from '@phosphor-icons/react'
import { Sidebar } from '../components/Sidebar'
import { PreviewPane } from '../components/PreviewPane'
import { ConfigEditor } from '../editors/ConfigEditor'
import { HeroEditor } from '../editors/HeroEditor'
import { GalleryEditor } from '../editors/GalleryEditor'
import { CommissionEditor } from '../editors/CommissionEditor'
import { FaqEditor } from '../editors/FaqEditor'
import { TosEditor } from '../editors/TosEditor'
import { ContactEditor } from '../editors/ContactEditor'
import { DiffViewer } from '../editors/DiffViewer'
import { useDraftStore } from '../store/useDraftStore'
import './DashboardLayout.css'

const EDITORS: Record<string, () => React.JSX.Element> = {
  config: ConfigEditor,
  hero: HeroEditor,
  gallery: GalleryEditor,
  commissions: CommissionEditor,
  faq: FaqEditor,
  tos: TosEditor,
  contact: ContactEditor,
  changes: DiffViewer,
}

export function DashboardLayout() {
  const [activeTab, setActiveTab] = useState('config')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [previewVisible, setPreviewVisible] = useState(false)

  const fetchLiveState = useDraftStore((s) => s.fetchLiveState)

  useEffect(() => {
    fetchLiveState()
  }, [fetchLiveState])

  const EditorComponent = EDITORS[activeTab] ?? ConfigEditor

  return (
    <div className="dashboard">
      {}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`sidebar-wrapper ${sidebarOpen ? 'open' : ''}`}>
        <Sidebar
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab)
            setSidebarOpen(false)
          }}
        />
      </div>

      <div className="dashboard-main">
        {}
        <div className="mobile-topbar">
          <button
            className="mobile-menu-btn"
            onClick={() => setSidebarOpen(true)}
            type="button"
            aria-label="Open menu"
          >
            <ListIcon size={22} />
          </button>
          <span className="mobile-topbar-title">Cloudy Admin</span>
          <button
            className="mobile-preview-toggle"
            onClick={() => setPreviewVisible(!previewVisible)}
            type="button"
            aria-label="Toggle preview"
          >
            {previewVisible ? <EyeSlashIcon size={20} /> : <EyeIcon size={20} />}
          </button>
        </div>

        <div className={`editor-pane ${previewVisible ? 'hidden-mobile' : ''}`}>
          <div className="editor-scroll">
            <EditorComponent />
          </div>
        </div>

        <div className={`preview-wrapper ${previewVisible ? 'visible-mobile' : ''}`}>
          <PreviewPane />
        </div>
      </div>
    </div>
  )
}
