import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  ArrowLeft,
  Camera,
  Upload,
  CheckCircle2,
  AlertCircle,
  Receipt,
  ShoppingBag,
  FileText,
  DollarSign,
  CreditCard,
  Loader2
} from 'lucide-react';
import PortalLayout from '@/components/portal/PortalLayout';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import toast from 'react-hot-toast';

function UploadPaymentEvidenceContent() {
  const router = useRouter();
  const { id, tipo } = router.query;
  const isCargoPos = tipo === 'cargo';
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [monto, setMonto] = useState('');
  const [success, setSuccess] = useState(false);
  const [paying, setPaying] = useState(false);

  const handleStripeCheckout = async () => {
    if (!id) return;
    setPaying(true);
    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'item',
          itemId: String(id),
          itemType: isCargoPos ? 'venta_pos' : 'clase',
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || 'Error al iniciar el pago');
        return;
      }
      window.location.href = json.url; // redirige a Stripe Checkout
    } catch {
      toast.error('Error de conexión');
    } finally {
      setPaying(false);
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(selected);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !monto) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      const itemId = String(id);
      const folder = isCargoPos ? 'cargos' : 'actividades';

      // 1. Subir a Storage
      const storageRef = ref(storage, `portal/evidencias-pago/${folder}/${itemId}/${Date.now()}_${file.name}`);
      const uploadResult = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(uploadResult.ref);

      // 2. Reportar el pago al endpoint correcto
      const endpoint = isCargoPos
        ? '/api/portal-usuarios/reportar-cargo-pago'
        : '/api/portal-usuarios/reportar-pago';

      const body = isCargoPos
        ? { cargoId: itemId, monto: Number(monto), evidenciaUrl: downloadURL, notas: 'Reportado desde el portal' }
        : { assignmentId: itemId, amount: Number(monto), evidenceUrl: downloadURL, notes: 'Reportado desde el portal de usuario' };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Error al guardar el reporte');
      }

      setSuccess(true);
      toast.success('Evidencia enviada correctamente');
      setTimeout(() => router.push('/portal/estado-de-cuenta'), 2000);
    } catch (error) {
      console.error('Error uploading payment:', error);
      toast.error(error.message || 'Error al subir la evidencia');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 animate-fade-in">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-500 shadow-lg shadow-green-500/20">
           <CheckCircle2 size={40} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-science-900">¡Reporte Enviado!</h2>
          <p className="text-science-500 font-medium max-w-xs mx-auto mt-2">Estamos validando tu pago. En breve verás el cambio en tu estado de cuenta.</p>
        </div>
        <button 
          onClick={() => router.push('/portal/estado-de-cuenta')}
          className="px-8 py-3 bg-science-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-primary transition-all shadow-xl shadow-science-900/20"
        >
          Regresar al listado
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-10 pb-10">
      
      {/* Header */}
      <div className="space-y-6 animate-fade-in">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-science-400 hover:text-primary transition-colors"
        >
          <ArrowLeft size={14} /> Regresar
        </button>
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-science-900 text-primary flex items-center justify-center shadow-xl border border-science-800">
            {isCargoPos ? <ShoppingBag size={28} /> : <Receipt size={28} />}
          </div>
          <div>
            <h1 className="text-4xl font-black text-science-900 tracking-tight">Reportar Pago</h1>
            <p className="text-science-500 font-medium mt-1">
              {isCargoPos ? 'Compra en tienda — sube tu comprobante' : 'Sube el comprobante de tu transferencia o depósito'}
            </p>
          </div>
        </div>
      </div>

      {/* Pago con tarjeta (instantáneo) */}
      <div className="bg-white rounded-[2rem] border border-science-100 p-8 shadow-sm space-y-4 animate-fade-in [animation-delay:0.05s]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#635BFF]/10 text-[#635BFF] flex items-center justify-center shrink-0">
            <CreditCard size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-science-900 leading-tight">Pagar con tarjeta</h3>
            <p className="text-xs text-science-400 font-medium">Pago inmediato y seguro — sin esperar validación</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleStripeCheckout}
          disabled={paying}
          className="w-full flex items-center justify-center gap-2 py-4 bg-[#635BFF] hover:bg-[#4F46E5] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-[#635BFF]/30 disabled:opacity-60"
        >
          {paying
            ? <><Loader2 size={14} className="animate-spin" /> Redirigiendo…</>
            : <><CreditCard size={14} /> Pagar con tarjeta</>}
        </button>
      </div>

      {/* Separador */}
      <div className="flex items-center gap-4 animate-fade-in [animation-delay:0.08s]">
        <div className="flex-1 h-px bg-science-100" />
        <span className="text-[10px] font-black text-science-300 uppercase tracking-widest whitespace-nowrap">o sube tu comprobante</span>
        <div className="flex-1 h-px bg-science-100" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in [animation-delay:0.1s]">
         {/* Dropzone / Upload Area */}
         <div className="relative">
            <label className="block text-[10px] font-black text-science-400 uppercase tracking-widest mb-3 ml-2">Comprobante de Pago (Imagen)</label>
            <div className={`
               relative border-2 border-dashed rounded-[2rem] p-10 transition-all flex flex-col items-center justify-center text-center group
               ${preview ? 'border-primary bg-primary/5' : 'border-science-100 bg-white hover:border-primary/30 hover:bg-science-50/50'}
            `}>
               {preview ? (
                  <div className="relative">
                     <img src={preview} className="max-h-64 rounded-2xl shadow-2xl mb-6" alt="Preview" />
                     <button 
                        type="button" 
                        onClick={() => { setFile(null); setPreview(null); }}
                        className="absolute -top-3 -right-3 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-all"
                     >
                        <AlertCircle size={16} />
                     </button>
                  </div>
               ) : (
                  <>
                     <div className="w-16 h-16 rounded-full bg-science-50 flex items-center justify-center text-science-200 mb-4 group-hover:scale-110 transition-transform duration-500">
                        <Camera size={32} />
                     </div>
                     <p className="text-sm font-bold text-science-800 mb-1">Presiona para cargar o arrastra una imagen</p>
                     <p className="text-xs text-science-400 font-medium">PNG, JPG o JPEG (Máx 5MB)</p>
                  </>
               )}
               <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
               />
            </div>
         </div>

         {/* Form Fields */}
         <div className="bg-white rounded-[2rem] border border-science-100 p-8 shadow-sm space-y-6">
            <div className="space-y-2">
               <label className="text-[10px] font-black text-science-400 uppercase tracking-widest ml-2">Monto Transferido (MXN)</label>
               <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-science-300 group-focus-within:text-primary transition-colors">
                     <DollarSign size={18} />
                  </div>
                  <input 
                     type="number"
                     required
                     value={monto}
                     onChange={e => setMonto(e.target.value)}
                     placeholder="0.00"
                     className="w-full pl-12 pr-4 py-4 bg-science-50/50 border border-science-100 rounded-2xl text-sm font-black text-science-900 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                  />
               </div>
            </div>

            <button 
               type="submit" 
               disabled={loading || !file || !monto}
               className="w-full py-5 bg-science-900 text-white rounded-[1.5rem] text-xs font-black uppercase tracking-widest hover:bg-primary transition-all flex items-center justify-center gap-3 shadow-2xl shadow-science-900/10 hover:shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
               {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
               ) : (
                  <>
                     <Upload size={18} /> Enviar Comprobante
                  </>
               )}
            </button>
         </div>

         <div className="flex items-center gap-3 p-6 bg-blue-50/50 border border-blue-100 rounded-2xl">
            <AlertCircle size={20} className="text-blue-500 shrink-0" />
            <p className="text-[10px] font-bold text-blue-800/60 leading-relaxed uppercase tracking-widest">
               Al enviar este comprobante, un administrador revisará la transacción y marcará tu cargo como pagado en el sistema.
            </p>
         </div>
      </form>
    </div>
  );
}

export default function PaymentEvidencePage() {
  return (
    <PortalLayout>
      <UploadPaymentEvidenceContent />
    </PortalLayout>
  );
}
