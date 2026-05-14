import React, { useState } from 'react';
import { db as firestoreDb, handleFirestoreError, OperationType } from './firebase';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { compressImage } from './utils/imageCompressor';

export default function Admin({ db, logo, qris, onLogout, pwd, setPwd }: any) {
    const [editKey, setEditKey] = useState<string | null>(null);
    const [formData, setFormData] = useState<any>({});
    const [newWa, setNewWa] = useState("");
    const [newPassword, setNewPassword] = useState("");

    const funnyInvoices = [
        "#BOSQUE-", "#SULTAN-", "#SAKTI-", "#NGEBUT-", 
        "#MANTAP-", "#GASPOL-", "#ANTILEMOT-", "#LANCARJAYA-"
    ];

    const generateFunnyInvoice = () => {
        const prefix = funnyInvoices[Math.floor(Math.random() * funnyInvoices.length)];
        return prefix + Math.floor(100 + Math.random() * 900);
    };

    const handleEdit = (wa: string) => {
        setEditKey(wa);
        setNewWa(wa);
        setFormData(db[wa] || { inv: generateFunnyInvoice(), nama: "", paket: "", periode: "", harga: "", lunas: false });
    };

    const handleSave = async () => {
        if (!newWa) return;
        try {
            const docData = { ...formData, updatedAt: serverTimestamp() };

            // Check if existing document or changing key
            if (editKey !== newWa && editKey) {
                // Delete old one
                await deleteDoc(doc(firestoreDb, 'customers', editKey));
                // Add new one
                docData.createdAt = serverTimestamp();
                await setDoc(doc(firestoreDb, 'customers', newWa), docData);
            } else if (!editKey) {
                // New document
                docData.createdAt = serverTimestamp();
                await setDoc(doc(firestoreDb, 'customers', newWa), docData);
            } else {
                // Changing existing by same key
                // Use setDoc in case it doesn't have createdAt, but it should. Keep createdAt if exists.
                const existing = db[newWa];
                if (existing && existing.createdAt) {
                    docData.createdAt = existing.createdAt;
                } else {
                    docData.createdAt = serverTimestamp();
                }
                await setDoc(doc(firestoreDb, 'customers', newWa), docData);
            }
            setEditKey(null);
        } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, 'customers/' + newWa);
        }
    };

    const handleDelete = async (wa: string) => {
        if (confirm("Hapus pelanggan ini?")) {
            try {
                await deleteDoc(doc(firestoreDb, 'customers', wa));
            } catch (error) {
                handleFirestoreError(error, OperationType.DELETE, 'customers/' + wa);
            }
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'qris') => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const compressedDataUrl = await compressImage(file);
                // Update Firebase config document
                await setDoc(doc(firestoreDb, 'config', 'main'), {
                     [type]: compressedDataUrl,
                     updatedAt: serverTimestamp()
                 }, { merge: true });
            } catch (error) {
                 handleFirestoreError(error, OperationType.WRITE, 'config/main');
            }
        }
    };

    const handleKirimInvoice = (wa: string, data: any) => {
        const waNumber = wa.startsWith('0') ? '62' + wa.substring(1) : wa;
        const text = `Assalamualaikum Kak *${data.nama}* yang cakep maksimal! 😎\n\nIni dari Mimin CiPUNK.NET mau ngabarin kalau tagihan internet bulan ini udah mendarat nih:\n\n*Invoice Kece:* ${data.inv}\n*Paket Jagoan:* ${data.paket}\n*Periode:* ${data.periode}\n*Total Maharnya:* ${data.harga}\n*Status:* ${data.lunas ? 'LUNAS JAYA ✅' : 'BELUM BAYAR NIH BESTIE ⏳'}\n\n${data.lunas ? 'Matur nuwun sanget! Internetnya udah lancar sedot teroooss!' : 'Yuk dibayar biar mabar sama drakorannya makin mulus no buffering!'}\n\nSalam Sinyal Kuat! ⚡`;
        const encodedText = encodeURIComponent(text);
        window.open(`https://wa.me/${waNumber}?text=${encodedText}`, '_blank');
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8 font-['Helvetica_Neue',Arial,sans-serif]">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <h1 className="text-3xl font-black text-blue-500 uppercase tracking-tighter italic">Dasbor Admin</h1>
                    <button onClick={onLogout} className="bg-red-500 px-6 py-2 rounded-xl font-bold hover:bg-red-600 transition w-full md:w-auto text-sm tracking-widest uppercase">Logout</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-slate-800 p-6 rounded-[2rem] shadow-xl border border-white/5">
                        <h2 className="text-xl font-black mb-6 uppercase tracking-wider text-yellow-400">Pengaturan Tampilan</h2>
                        <div className="mb-6">
                            <label className="block text-xs font-bold mb-2 text-slate-400 uppercase tracking-widest">Upload Logo Aplikasi</label>
                            <input type="file" accept="image/*" onChange={(e) => handleUpload(e, 'logo')} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border border-blue-500/30 file:bg-blue-600/20 file:text-blue-400 file:font-bold hover:file:bg-blue-600/30 cursor-pointer" />
                            {logo && <img src={logo} className="h-16 mt-4 bg-slate-700/50 p-3 rounded-2xl object-contain border border-white/10" alt="Logo preview" />}
                        </div>
                        <div>
                            <label className="block text-xs font-bold mb-2 text-slate-400 uppercase tracking-widest">Upload Berkas QRIS</label>
                            <input type="file" accept="image/*" onChange={(e) => handleUpload(e, 'qris')} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border border-blue-500/30 file:bg-blue-600/20 file:text-blue-400 file:font-bold hover:file:bg-blue-600/30 cursor-pointer" />
                            {qris && <img src={qris} className="h-32 mt-4 bg-white p-2 rounded-2xl object-contain border-4 border-slate-300" alt="QRIS preview" />}
                        </div>
                    </div>

                    <div className="bg-slate-800 p-6 rounded-[2rem] shadow-xl border border-white/5 flex flex-col">
                        <h2 className="text-xl font-black mb-6 uppercase tracking-wider text-green-400">Informasi Pengembang</h2>
                        <div className="flex-1 flex flex-col justify-center space-y-4 text-sm font-medium mb-6">
                            <div className="flex justify-between border-b border-white/10 pb-2">
                                <span className="text-slate-500">Aplikasi</span>
                                <span className="text-white">CiPUNK.NET Billing App</span>
                            </div>
                            <div className="flex justify-between border-b border-white/10 pb-2">
                                <span className="text-slate-500">WhatsApp Admin</span>
                                <strong className="text-white">085852339600</strong>
                            </div>
                            <div className="flex justify-between pb-2">
                                <span className="text-slate-500">Email</span>
                                <strong className="text-blue-400">cipunknet@gmail.com</strong>
                            </div>
                        </div>

                        <div className="mt-auto pt-6 border-t border-white/10">
                            <h3 className="text-xs font-black mb-3 uppercase tracking-widest text-slate-400">Ubah Sandi Dasbor</h3>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    placeholder="Sandi baru..." 
                                    className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                />
                                <button 
                                    onClick={() => {
                                        if (newPassword.trim()) {
                                            setPwd(newPassword.trim());
                                            setNewPassword("");
                                            alert("Sandi berhasil diubah!");
                                        }
                                    }}
                                    className="bg-slate-700 hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition"
                                >
                                    Simpan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800 p-6 rounded-[2rem] shadow-xl border border-white/5">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                        <h2 className="text-xl font-black uppercase tracking-wider text-blue-400">Kelola Data Pelanggan</h2>
                        <button onClick={() => handleEdit("")} className="bg-blue-600 px-6 py-3 rounded-xl font-black text-xs hover:bg-blue-700 transition uppercase tracking-widest w-full md:w-auto shadow-lg shadow-blue-900/50">+ Tambah Pelanggan</button>
                    </div>

                    {editKey !== null && (
                        <div className="bg-slate-900/80 p-6 rounded-2xl mb-8 grid grid-cols-1 md:grid-cols-2 gap-4 border border-blue-500/30 animate-[fadeInUp_0.3s_ease]">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">No WhatsApp</label>
                                <input value={newWa} onChange={e => setNewWa(e.target.value)} placeholder="08..." className="w-full bg-slate-800 p-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Nama Lengkap</label>
                                <input value={formData.nama} onChange={e => setFormData({ ...formData, nama: e.target.value })} placeholder="Nama" className="w-full bg-slate-800 p-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 flex justify-between">
                                    <span>Invoice</span>
                                    <button onClick={() => setFormData({ ...formData, inv: generateFunnyInvoice() })} className="text-blue-400 hover:text-blue-300">🔄 Lucu</button>
                                </label>
                                <input value={formData.inv} onChange={e => setFormData({ ...formData, inv: e.target.value })} placeholder="#CPK-..." className="w-full bg-slate-800 p-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Paket Layanan</label>
                                <input value={formData.paket} onChange={e => setFormData({ ...formData, paket: e.target.value })} placeholder="Cth: 15 Mbps" className="w-full bg-slate-800 p-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Periode</label>
                                <input value={formData.periode} onChange={e => setFormData({ ...formData, periode: e.target.value })} placeholder="Cth: Mei 2024" className="w-full bg-slate-800 p-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Total Harga</label>
                                <input value={formData.harga} onChange={e => setFormData({ ...formData, harga: e.target.value })} placeholder="Rp 150.000" className="w-full bg-slate-800 p-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div className="flex items-center mt-2 bg-slate-800 p-3 rounded-xl">
                                <label className="text-xs font-black uppercase tracking-widest flex-1 cursor-pointer" htmlFor="lunas_checkbox">Status Pembayaran (Lunas?)</label>
                                <input id="lunas_checkbox" type="checkbox" checked={formData.lunas} onChange={e => setFormData({ ...formData, lunas: e.target.checked })} className="w-6 h-6 accent-green-500 cursor-pointer" />
                            </div>
                            <div className="md:col-span-2 flex flex-col md:flex-row justify-end gap-3 mt-4">
                                <button onClick={() => setEditKey(null)} className="px-6 py-3 rounded-xl bg-slate-700 text-white font-black text-xs uppercase tracking-widest hover:bg-slate-600 w-full md:w-auto">Batal</button>
                                <button onClick={handleSave} className="px-6 py-3 rounded-xl bg-green-500 text-slate-900 font-black text-xs uppercase tracking-widest hover:bg-green-400 w-full md:w-auto shadow-lg shadow-green-900/50">💾 Simpan Data</button>
                            </div>
                        </div>
                    )}

                    <div className="overflow-x-auto rounded-xl border border-white/5">
                        <table className="w-full text-left text-sm text-slate-300">
                            <thead className="bg-slate-900 text-slate-400 uppercase tracking-widest text-[10px] font-black">
                                <tr>
                                    <th className="p-4 rounded-tl-xl whitespace-nowrap">WhatsApp</th>
                                    <th className="p-4">Nama</th>
                                    <th className="p-4">Paket</th>
                                    <th className="p-4">Invoice</th>
                                    <th className="p-4 text-center">Status Lunas</th>
                                    <th className="p-4 text-center">Bukti Transfer</th>
                                    <th className="p-4 rounded-tr-xl text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.keys(db).length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-slate-500 font-bold italic">Belum ada data pelanggan.</td>
                                    </tr>
                                )}
                                {Object.keys(db).map((wa) => (
                                    <tr key={wa} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                                        <td className="p-4 font-bold text-white whitespace-nowrap">{wa}</td>
                                        <td className="p-4 font-medium">{db[wa].nama}</td>
                                        <td className="p-4"><span className="bg-slate-700 px-2 py-1 rounded text-xs">{db[wa].paket}</span></td>
                                        <td className="p-4 text-slate-400">{db[wa].inv}</td>
                                        <td className="p-4 text-center">
                                            {db[wa].lunas ? <span className="text-green-400 font-black text-xs bg-green-900/30 px-3 py-1 rounded-full uppercase tracking-widest">Lunas</span> : <span className="text-red-400 font-black text-xs bg-red-900/30 px-3 py-1 rounded-full uppercase tracking-widest">Belum</span>}
                                        </td>
                                        <td className="p-4 text-center">
                                            {db[wa].buktiTransfer ? (
                                                <a href={db[wa].buktiTransfer} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-white font-bold text-xs uppercase tracking-widest underline">Lihat Bukti</a>
                                            ) : (
                                                <span className="text-slate-500 text-xs italic">-</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center whitespace-nowrap">
                                            <button onClick={() => handleKirimInvoice(wa, db[wa])} className="text-green-400 hover:text-white font-bold text-xs uppercase tracking-widest mr-3 transition">WA Invois</button>
                                            <button onClick={() => handleEdit(wa)} className="text-blue-400 hover:text-white font-bold text-xs uppercase tracking-widest mr-3 transition">Edit</button>
                                            <button onClick={() => handleDelete(wa)} className="text-red-400 hover:text-white font-bold text-xs uppercase tracking-widest transition">Hapus</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

