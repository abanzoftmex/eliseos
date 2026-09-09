import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faXmark, 
  faNoteSticky, 
  faPaperPlane, 
  faTrashAlt, 
  faEdit, 
  faCheck, 
  faClock 
} from '@fortawesome/free-solid-svg-icons';
import { collection, query, where, orderBy, getDocs, addDoc, deleteDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { showSuccessToast, showErrorToast } from '../utils/toast';

const NotasSidePanel = ({ isOpen, onClose, cliente }) => {
  const [notas, setNotas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newNota, setNewNota] = useState('');
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  // Cargar notas del cliente
  useEffect(() => {
    if (isOpen && cliente) {
      loadNotas();
    }
  }, [isOpen, cliente]);

  const loadNotas = async () => {
    if (!cliente?.id) return;

    try {
      setLoading(true);
      const notasRef = collection(db, 'notas');
      const q = query(
        notasRef,
        where('clienteId', '==', cliente.id),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const notasData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setNotas(notasData);
    } catch (error) {
      console.error('Error loading notas:', error);
      showErrorToast('Error al cargar las notas');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNota = async (e) => {
    e.preventDefault();
    if (!newNota.trim() || !cliente?.id) return;

    try {
      setSending(true);
      const notasRef = collection(db, 'notas');
      
      const notaData = {
        clienteId: cliente.id,
        clienteNombre: `${cliente.nombre} ${cliente.apellidoPaterno}`,
        contenido: newNota.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        autor: 'Sistema' // TODO: Reemplazar con el usuario actual
      };

      await addDoc(notasRef, notaData);
      
      setNewNota('');
      showSuccessToast('Nota agregada exitosamente');
      await loadNotas();
    } catch (error) {
      console.error('Error adding nota:', error);
      showErrorToast('Error al agregar la nota');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteNota = async (notaId) => {
    if (!confirm('¿Estás seguro de eliminar esta nota?')) return;

    try {
      await deleteDoc(doc(db, 'notas', notaId));
      showSuccessToast('Nota eliminada');
      await loadNotas();
    } catch (error) {
      console.error('Error deleting nota:', error);
      showErrorToast('Error al eliminar la nota');
    }
  };

  const handleEditNota = (nota) => {
    setEditingId(nota.id);
    setEditText(nota.contenido);
  };

  const handleSaveEdit = async (notaId) => {
    if (!editText.trim()) return;

    try {
      await updateDoc(doc(db, 'notas', notaId), {
        contenido: editText.trim(),
        updatedAt: serverTimestamp()
      });

      showSuccessToast('Nota actualizada');
      setEditingId(null);
      setEditText('');
      await loadNotas();
    } catch (error) {
      console.error('Error updating nota:', error);
      showErrorToast('Error al actualizar la nota');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Fecha no disponible';
    
    let date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }

    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Hace un momento';
    if (minutes < 60) return `Hace ${minutes} min`;
    if (hours < 24) return `Hace ${hours} h`;
    if (days < 7) return `Hace ${days} d`;

    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Side Panel */}
      <div className="fixed right-0 top-0 h-full w-full md:w-[500px] bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <FontAwesomeIcon icon={faNoteSticky} className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Notas del Cliente</h2>
              <p className="text-sm text-cyan-100">
                {cliente?.nombre} {cliente?.apellidoPaterno}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <FontAwesomeIcon icon={faXmark} className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Lista de Notas */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-600"></div>
            </div>
          ) : notas.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FontAwesomeIcon icon={faNoteSticky} className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                No hay notas registradas
              </h3>
              <p className="text-sm text-gray-500">
                Agrega la primera nota para este cliente
              </p>
            </div>
          ) : (
            notas.map((nota) => (
              <div
                key={nota.id}
                className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow"
              >
                {editingId === nota.id ? (
                  // Modo edición
                  <div className="space-y-3">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none resize-none"
                      rows="3"
                      autoFocus
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSaveEdit(nota.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5" />
                        Guardar
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-400 transition-colors"
                      >
                        <FontAwesomeIcon icon={faXmark} className="w-3.5 h-3.5" />
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  // Modo vista
                  <>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <FontAwesomeIcon icon={faClock} className="w-3 h-3" />
                        <span>{formatDate(nota.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditNota(nota)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar nota"
                        >
                          <FontAwesomeIcon icon={faEdit} className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteNota(nota.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar nota"
                        >
                          <FontAwesomeIcon icon={faTrashAlt} className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {nota.contenido}
                    </p>
                    {nota.autor && (
                      <p className="text-xs text-gray-400 mt-2">
                        Por: {nota.autor}
                      </p>
                    )}
                  </>
                )}
              </div>
            ))
          )}
        </div>

        {/* Formulario Nueva Nota */}
        <div className="border-t border-gray-200 p-4 bg-white">
          <form onSubmit={handleAddNota} className="space-y-3">
            <textarea
              value={newNota}
              onChange={(e) => setNewNota(e.target.value)}
              placeholder="Escribe una nueva nota..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none resize-none"
              rows="3"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!newNota.trim() || sending}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-cyan-700 text-white font-semibold rounded-xl hover:from-cyan-700 hover:to-cyan-800 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Enviando...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faPaperPlane} className="w-4 h-4" />
                  Agregar Nota
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default NotasSidePanel;
