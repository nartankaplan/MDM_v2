import { 
  X, 
  Lock, 
  Unlock, 
  Trash2, 
  MapPin, 
  RotateCcw, 
  Smartphone,
  Battery,
  Wifi,
  Calendar,
  User,
  Phone,
  AlertTriangle,
  Settings,
  Package
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { deviceApi, commandApi } from '../services/api'

function DeviceManagement({ device, onClose, onDeviceUpdate }) {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(false)
  const [showAppManagement, setShowAppManagement] = useState(false)
  const [deviceApps, setDeviceApps] = useState([])
  const [appLoading, setAppLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Cihaza ait aktiviteleri çek
  useEffect(() => {
    if (device?.id) {
      fetchDeviceActivities()
    }
  }, [device?.id])

  const fetchDeviceActivities = async () => {
    try {
      const result = await commandApi.getByDevice(device.id)
      if (result.success) {
        setActivities(result.data)
      }
    } catch (error) {
      console.error('Aktiviteler yüklenirken hata:', error)
      setActivities([])
    }
  }

  const fetchDeviceApps = async () => {
    try {
      setAppLoading(true)
      const result = await deviceApi.getApps(device.id)
      if (result.success) {
        setDeviceApps(result.data)
      } else {
        console.error('Uygulamalar alınırken hata:', result.error)
        setDeviceApps([])
      }
    } catch (error) {
      console.error('Uygulamalar yüklenirken hata:', error)
      setDeviceApps([])
    } finally {
      setAppLoading(false)
    }
  }

  const toggleAppStatus = async (appId, newStatus) => {
    try {
      const result = await deviceApi.toggleApp(device.id, appId, newStatus)
      
      if (result.success) {
        // Local state'i güncelle
        setDeviceApps(prevApps => 
          prevApps.map(app => 
            app.id === appId 
              ? { ...app, isInstalled: newStatus }
              : app
          )
        )
        
        // Aktiviteleri yenile
        await fetchDeviceActivities()
        
        alert(`Uygulama ${newStatus ? 'aktif' : 'pasif'} edildi!`)
      } else {
        alert('Uygulama durumu değiştirilirken hata oluştu: ' + result.error)
      }
    } catch (error) {
      console.error('Uygulama durumu değiştirilirken hata:', error)
      alert('Uygulama durumu değiştirilirken bir hata oluştu!')
    }
  }

  const handleAction = async (action) => {
    try {
      setLoading(true)
      console.log(`${action} action for device:`, device.name)
      
      // Backend'e komut gönder
      const result = await deviceApi.sendCommand(device.id, action)
      
      if (result.success) {
        // Aktiviteleri ve cihaz listesini güncelle
        await fetchDeviceActivities()
        if (onDeviceUpdate) {
          onDeviceUpdate()
        }
        
        alert(`${action} komutu başarıyla gönderildi!`)
      } else {
        alert('Komut gönderilirken hata oluştu: ' + result.error)
      }
    } catch (error) {
      console.error('Komut gönderme hatası:', error)
      alert('Komut gönderilirken bir hata oluştu!')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDevice = async () => {
    try {
      setDeleteLoading(true)
      console.log('Deleting device:', device.name)
      
      // Backend'e silme isteği gönder
      const result = await deviceApi.delete(device.id)
      
      if (result.success) {
        alert(`Cihaz "${device.name}" başarıyla silindi!`)
        // Cihaz listesini güncelle ve modal'ı kapat
        if (onDeviceUpdate) {
          onDeviceUpdate()
        }
        onClose()
      } else {
        alert('Cihaz silinirken hata oluştu: ' + result.error)
      }
    } catch (error) {
      console.error('Cihaz silme hatası:', error)
      alert('Cihaz silinirken bir hata oluştu!')
    } finally {
      setDeleteLoading(false)
      setShowDeleteConfirm(false)
    }
  }

  const getBatteryColor = (battery) => {
    if (battery > 60) return 'battery-high'
    if (battery > 30) return 'battery-medium'
    return 'battery-low'
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
        return 'status-online'
      case 'offline':
        return 'status-offline'
      case 'warning':
        return 'status-warning'
      default:
        return 'status-offline'
    }
  }

  return (
    <div className="device-management">
      <div className="management-header">
        <h2>Cihaz Yönetimi</h2>
        <button className="close-button" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <div className="device-overview">
        <div className="device-info-card">
          <div className="device-icon-large">
            <Smartphone size={48} />
          </div>
          <div className="device-details-main">
            <h3>{device.name}</h3>
            <p className="device-model">{device.model}</p>
            <span className={`status-indicator ${getStatusColor(device.status)}`}>
              {device.status === 'online' ? 'Çevrimiçi' : 
               device.status === 'offline' ? 'Çevrimdışı' : 'Uyarı'}
            </span>
          </div>
        </div>

        <div className="device-stats-grid">
          <div className="stat-item">
            <Battery size={20} />
            <div>
              <div className={`stat-value ${getBatteryColor(device.battery)}`}>
                {device.battery}%
              </div>
              <div className="stat-label">Batarya</div>
            </div>
          </div>
          
          <div className="stat-item">
            <Wifi size={20} />
            <div>
              <div className="stat-value">
                {device.status === 'online' ? 'Bağlı' : 'Bağlı Değil'}
              </div>
              <div className="stat-label">Bağlantı</div>
            </div>
          </div>
          
          <div className="stat-item">
            <Calendar size={20} />
            <div>
              <div className="stat-value">{device.lastSeen}</div>
              <div className="stat-label">Son Görülme</div>
            </div>
          </div>
        </div>
      </div>

      <div className="management-actions">
        <h3>Cihaz İşlemleri</h3>
        <div className="actions-grid">
          <button 
            className="action-button lock disabled"
            disabled={true}
            title="Bu özellik henüz aktif değil"
          >
            <Lock size={20} />
            <span>Cihazı Kilitle</span>
          </button>
          
          <button 
            className="action-button unlock disabled"
            disabled={true}
            title="Bu özellik henüz aktif değil"
          >
            <Unlock size={20} />
            <span>Kilidi Aç</span>
          </button>
          
          <button 
            className="action-button locate disabled"
            disabled={true}
            title="Bu özellik henüz aktif değil"
          >
            <MapPin size={20} />
            <span>Konum Bul</span>
          </button>
          
          <button 
            className="action-button restart disabled"
            disabled={true}
            title="Bu özellik henüz aktif değil"
          >
            <RotateCcw size={20} />
            <span>Yeniden Başlat</span>
          </button>
          
          <button 
            className="action-button apps"
            onClick={() => {
              setShowAppManagement(true)
              fetchDeviceApps()
            }}
            disabled={loading}
            title="Uygulama yönetimi aktif"
          >
            <Package size={20} />
            <span>Uygulama Yönet</span>
          </button>
          
          <button 
            className="action-button wipe danger disabled"
            disabled={true}
            title="Bu özellik henüz aktif değil"
          >
            <Trash2 size={20} />
            <span>Cihazı Sıfırla</span>
          </button>
          
          <button 
            className="action-button alert disabled"
            disabled={true}
            title="Bu özellik henüz aktif değil"
          >
            <AlertTriangle size={20} />
            <span>Alarm Gönder</span>
          </button>
          
          <button 
            className="action-button delete danger"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={loading || deleteLoading}
            title="Cihazı sil"
          >
            <Trash2 size={20} />
            <span>Cihazı Sil</span>
          </button>
        </div>
      </div>

      <div className="device-information">
        <h3>Cihaz Bilgileri</h3>
        <div className="info-grid">
          <div className="info-item">
            <label>IMEI</label>
            <span>{device.imei}</span>
          </div>
          
          <div className="info-item">
            <label>Telefon Numarası</label>
            <span>{device.phoneNumber}</span>
          </div>
          
          <div className="info-item">
            <label>İşletim Sistemi</label>
            <span>{device.osVersion}</span>
          </div>
          
          <div className="info-item">
            <label>Konum</label>
            <span>{device.location}</span>
          </div>
          
          <div className="info-item">
            <label>Kullanıcı</label>
            <span>{device.employee}</span>
          </div>
          
          <div className="info-item">
            <label>Son Aktivite</label>
            <span>{device.lastSeen}</span>
          </div>
        </div>
      </div>

      <div className="recent-activities">
        <h3>Son Aktiviteler</h3>
        <div className="activity-list">
          {activities.length > 0 ? (
            activities.slice(0, 5).map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className="activity-icon">
                  {activity.action === 'locate' && <MapPin size={16} />}
                  {activity.action === 'lock' && <Lock size={16} />}
                  {activity.action === 'unlock' && <Unlock size={16} />}
                  {activity.action === 'restart' && <RotateCcw size={16} />}
                  {activity.action === 'wipe' && <Trash2 size={16} />}
                  {activity.action === 'alert' && <AlertTriangle size={16} />}
                  {activity.action === 'install_app' && <Package size={16} />}
                  {activity.action === 'uninstall_app' && <Package size={16} />}
                  {!['locate', 'lock', 'unlock', 'restart', 'wipe', 'alert', 'install_app', 'uninstall_app'].includes(activity.action) && <Smartphone size={16} />}
                </div>
                <div className="activity-content">
                  <div className="activity-title">{activity.description || activity.action}</div>
                  <div className="activity-time">
                    {activity.status === 'completed' ? 'Tamamlandı' : 
                     activity.status === 'pending' ? 'Bekliyor' : 
                     activity.status === 'failed' ? 'Başarısız' : activity.status}
                    {' - '}
                    {new Date(activity.createdAt).toLocaleString('tr-TR')}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-activities">
              <p>Bu cihaz için henüz aktivite bulunmuyor.</p>
            </div>
          )}
        </div>
      </div>

      {/* Uygulama Yönetimi Modal */}
      {showAppManagement && (
        <div className="app-management-modal" style={{zIndex: 9999}}>
          <div className="modal-overlay" onClick={() => setShowAppManagement(false)}></div>
          <div className="modal-content" style={{zIndex: 10000, position: 'relative'}}>
            <div className="modal-header">
              <h3>Uygulama Yönetimi</h3>
              <button className="close-button" onClick={() => setShowAppManagement(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body" style={{background: 'var(--bg-primary)', color: 'var(--text-primary)'}}>
              {appLoading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Uygulamalar yükleniyor...</p>
                </div>
              ) : (
                <div className="app-list">
                  {deviceApps.map((app) => (
                    <div key={app.id} className="app-item" style={{background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)'}}>
                      <div className="app-info">
                        <div className="app-icon" style={{width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                          {app.iconUrl ? (
                            <img src={app.iconUrl} alt={app.name} style={{width: 28, height: 28, borderRadius: 6, objectFit: 'cover'}} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                          ) : (
                            <Package size={24} />
                          )}
                        </div>
                        <div className="app-details">
                          <h4 style={{color: 'var(--text-primary)'}}>{app.name}</h4>
                          <p className="app-package">{app.packageName}</p>
                          {app.version && <p className="app-version">v{app.version}</p>}
                        </div>
                      </div>
                      <div className="app-controls">
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={app.isInstalled}
                            onChange={(e) => toggleAppStatus(app.id, e.target.checked)}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                        <span className="app-status">
                          {app.isInstalled ? 'Aktif' : 'Pasif'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cihaz Silme Onay Modal'ı */}
      {showDeleteConfirm && (
        <div className="app-management-modal" style={{zIndex: 9999}}>
          <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}></div>
          <div className="modal-content" style={{zIndex: 10000, position: 'relative'}}>
            <div className="modal-header">
              <h3>Cihazı Sil</h3>
              <button className="close-button" onClick={() => setShowDeleteConfirm(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body" style={{background: 'var(--bg-primary)', color: 'var(--text-primary)'}}>
              <div className="delete-confirmation">
                <div className="warning-icon">
                  <AlertTriangle size={48} style={{color: '#ef4444'}} />
                </div>
                <h4 style={{color: 'var(--text-primary)', marginBottom: '16px'}}>
                  Cihazı Silmek İstediğinizden Emin misiniz?
                </h4>
                <p style={{color: 'var(--text-secondary)', marginBottom: '24px'}}>
                  <strong>"{device.name}"</strong> cihazı kalıcı olarak silinecek. 
                  Bu işlem geri alınamaz ve cihaza ait tüm veriler (komutlar, uygulamalar, aktiviteler) silinecektir.
                </p>
                
                <div className="confirmation-actions">
                  <button 
                    className="cancel-button"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={deleteLoading}
                  >
                    İptal
                  </button>
                  <button 
                    className="delete-button danger"
                    onClick={handleDeleteDevice}
                    disabled={deleteLoading}
                  >
                    {deleteLoading ? 'Siliniyor...' : 'Evet, Sil'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DeviceManagement
