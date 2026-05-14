import React, { useState, useEffect } from 'react';
import Admin from './Admin';
import { auth, googleProvider, db as firestoreDb, handleFirestoreError, OperationType } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, doc, getDoc, setDoc, updateDoc, deleteDoc, getDocs, onSnapshot, query, serverTimestamp } from 'firebase/firestore';
import { compressImage } from './utils/imageCompressor';

const initialDatabase: Record<string, any> = {
    "085852339600": { 
        inv: "#CPK-001", nama: "Saifudin Gofur", paket: "30 Mbps", periode: "Mei 2024", harga: "Rp 200.000", lunas: false 
    },
    "081234567890": { 
        inv: "#CPK-002", nama: "Dewi Mega Silvia", paket: "15 Mbps", periode: "Mei 2024", harga: "Rp 150.000", lunas: true 
    },
    "089988776655": { 
        inv: "#CPK-003", nama: "Mas Budi Santoso", paket: "50 Mbps", periode: "Mei 2024", harga: "Rp 300.000", lunas: false 
    }
};

export default function App() {
    const [view, setView] = useState<'home' | 'admin_login' | 'admin'>('home');
    const [adminPwdInput, setAdminPwdInput] = useState('');
    const [savedPwd, setSavedPwd] = useState<string>(() => localStorage.getItem('cipunk_pwd') || 'petokpetok');
    
    // We will sync db with Firebase if admin, but read via WA for public
    const [db, setDb] = useState<Record<string, any>>({});
    const [logo, setLogo] = useState<string>('/logo.png');
    const [qris, setQris] = useState<string>('/qris.png');
    
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user && user.email === 'cipunknet@gmail.com') {
                setIsAdmin(true);
            } else {
                setIsAdmin(false);
            }
        });
        return () => unsubscribe();
    }, []);

    // Real-time listener for Config
    useEffect(() => {
        const unsub = onSnapshot(doc(firestoreDb, 'config', 'main'), (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                if (data.logo) setLogo(data.logo);
                if (data.qris) setQris(data.qris);
            }
        }, (error) => {
            console.error("Failed to load config", error);
        });
        return () => unsub();
    }, []);

    // Admin real-time listeners for DB
    useEffect(() => {
        if (isAdmin && view === 'admin') {
            const unsub = onSnapshot(collection(firestoreDb, 'customers'), (snapshot) => {
                const newDb: Record<string, any> = {};
                snapshot.forEach(doc => {
                    newDb[doc.id] = doc.data();
                });
                setDb(newDb);
            }, (error) => {
                handleFirestoreError(error, OperationType.GET, 'customers');
            });
            return () => unsub();
        }
    }, [isAdmin, view]);

    useEffect(() => {
        localStorage.setItem('cipunk_pwd', savedPwd);
    }, [savedPwd]);

    const [phoneInput, setPhoneInput] = useState("");
    const [tagihan, setTagihan] = useState<any | null>(null);
    const [metode, setMetode] = useState("qris");
    const [wifis, setWifis] = useState<{ id: number; left: string; top: string; size: string; duration: string }[]>([]);
    const [uploadingBukti, setUploadingBukti] = useState(false);

    useEffect(() => {
        const generatedWifis = Array.from({ length: 15 }).map((_, i) => ({
            id: i,
            left: Math.random() * 100 + 'vw',
            top: Math.random() * 100 + 'vh',
            size: (Math.random() * 20 + 15) + 'px',
            duration: (Math.random() * 10 + 10) + 's'
        }));
        setWifis(generatedWifis);
    }, []);

    const cekTagihan = async () => {
        if (!phoneInput) return;
        try {
            const customerDoc = await getDoc(doc(firestoreDb, 'customers', phoneInput));
            if (customerDoc.exists()) {
                const data = customerDoc.data();
                setTagihan(data);
                if (!data.lunas) {
                    setMetode('qris');
                }
                setTimeout(() => {
                    document.getElementById('tagihanResult')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            } else {
                alert("Ngapunten, Nomor WA mboten terdaftar. Cobi dicek malih nggih!");
            }
        } catch (error) {
            handleFirestoreError(error, OperationType.GET, 'customers/' + phoneInput);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            alert("Nomor Rekening sampun tersalin! 🙏");
        });
    };

    const konfirmasiWA = (via: string) => {
        if (!tagihan) return;
        const teks = `Assalamualaikum Admin,%0AKulo sampun transfer tagihan CiPUNK.NET:%0A%0AInvoice: ${tagihan.inv}%0ANama: ${tagihan.nama}%0ATotal: ${tagihan.harga}%0AVia: ${via}%0A%0AMohon diproses nggih. Matur Nuwun! 🙏`;
        window.open(`https://wa.me/6285852339600?text=${teks}`, '_blank');
    };

    const uploadBuktiTransfer = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !phoneInput) return;

        setUploadingBukti(true);
        try {
            const compressedDataUrl = await compressImage(file);
            await updateDoc(doc(firestoreDb, 'customers', phoneInput), {
                buktiTransfer: compressedDataUrl,
                updatedAt: serverTimestamp()
            });
            alert('Bukti transfer berhasil diunggah! 🙏');
            cekTagihan();
        } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, 'customers/' + phoneInput);
            alert('Gagal mengunggah bukti transfer.');
        } finally {
            setUploadingBukti(false);
        }
    };

    if (view === 'admin') {
        return <Admin db={db} logo={logo} qris={qris} pwd={savedPwd} setPwd={setSavedPwd} onLogout={() => { setView('home'); signOut(auth); }} />;
    }

    if (view === 'admin_login') {
        const handleLoginGoogle = async () => {
            if (adminPwdInput !== savedPwd) {
                alert('Sandi salah!');
                return;
            }
            try {
                await signInWithPopup(auth, googleProvider);
                if (auth.currentUser?.email === 'cipunknet@gmail.com') {
                    setView('admin');
                    setAdminPwdInput('');
                } else {
                    alert('Akses Ditolak! Gunakan email cipunknet@gmail.com.');
                    await signOut(auth);
                }
            } catch (error) {
                console.error(error);
                alert('Gagal Login dengan Google.');
            }
        };

        return (
            <div className="min-h-screen bg-[#080d17] flex items-center justify-center p-4 font-['Helvetica_Neue',Arial,sans-serif]">
                <div className="bg-white/5 border border-white/10 backdrop-blur-xl p-8 rounded-[3rem] w-full max-w-sm shadow-2xl">
                    <div className="text-center mb-8">
                        <div className="text-4xl mb-4">🔐</div>
                        <h2 className="text-2xl font-black text-white italic uppercase tracking-widest">Login Admin</h2>
                        <p className="text-slate-400 text-xs mt-2 font-bold">Amankan dengan Google Auth</p>
                    </div>
                    <input 
                        type="password" 
                        value={adminPwdInput} 
                        onChange={e => setAdminPwdInput(e.target.value)} 
                        placeholder="Masukkan Sandi rahasia..." 
                        className="w-full bg-white/10 text-white p-4 rounded-2xl mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold placeholder:text-slate-500" 
                        onKeyDown={e => e.key === 'Enter' && handleLoginGoogle()} 
                        autoFocus
                    />
                    <button onClick={handleLoginGoogle} className="w-full bg-blue-600 flex items-center justify-center gap-2 text-white font-black py-4 rounded-2xl hover:bg-blue-700 transition shadow-lg shadow-blue-500/30 uppercase tracking-widest text-xs">
                        Akses Masuk & Login Firebase
                    </button>
                    <button onClick={() => setView('home')} className="w-full mt-6 text-slate-500 text-xs font-bold hover:text-white uppercase tracking-widest transition">Kembali ke Beranda</button>
                </div>
            </div>
        );
    }

    return (
        <div className="text-slate-100 font-['Helvetica_Neue',Arial,sans-serif] bg-[#080d17] min-h-screen overflow-x-hidden relative">
            <div className="absolute top-0 left-0 w-full h-full opacity-30 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] md:w-[600px] md:h-[600px] bg-blue-600 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] md:w-[600px] md:h-[600px] bg-blue-900 rounded-full blur-[100px]"></div>
            </div>

            {wifis.map((w) => (
                <i key={w.id} className="fas fa-wifi fixed text-blue-500/20 pointer-events-none z-0" style={{ left: w.left, top: w.top, fontSize: w.size, animation: `floating ${w.duration} ease-in-out infinite` }}></i>
            ))}

            {/* Top Marquee */}
            <div className="relative z-20 w-full bg-[#fbce03] py-2 overflow-hidden whitespace-nowrap shadow-lg">
                <div className="marquee-content px-4 space-x-12">
                    <span className="text-[#0f172a] font-black italic uppercase text-sm">🚀 PROMO BERKAH: REGISTRASI CUMA 200RB LANGSUNG ON!</span>
                    <span className="text-[#0f172a] font-black italic uppercase text-sm">✨ SINYAL KUAT, HATIPUN JADI SENANG</span>
                    <span className="text-[#0f172a] font-black italic uppercase text-sm">⚡ INTERNET MANCUR, DOMPET MAKMUR!</span>
                    <span className="text-[#0f172a] font-black italic uppercase text-sm">🚀 PROMO BERKAH: REGISTRASI CUMA 200RB LANGSUNG ON!</span>
                </div>
            </div>

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 p-4 md:p-8 max-w-[1600px] mx-auto min-h-[calc(100vh-40px)]">
                {/* Left Section */}
                <div className="md:col-span-8 flex flex-col gap-6">
                    {/* Brand Hero */}
                    <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-[3rem] p-8 flex flex-col md:flex-row items-center gap-8">
                        <div className="flex-1 text-center md:text-left">
                            <img src={logo} alt="CiPUNK Logo" className="h-16 md:h-20 mb-6 object-contain animate-[floatLogo_3s_ease-in-out_infinite]" />
                            <h1 className="text-6xl font-black italic uppercase tracking-tighter">
                                CiPUNK.<span className="text-blue-500">NET</span>
                            </h1>
                            <p className="text-slate-400 mt-2 font-medium italic">
                                "Mboten usah nunggu gajian wulan ngarep, dinten niki daftar, dinten niki ugi langsung saged drakoran lancar jaya!"
                            </p>
                        </div>
                        <div className="bg-blue-600/20 p-4 rounded-3xl border border-blue-500/30 flex-shrink-0">
                            <div className="text-yellow-400 text-xs font-black uppercase tracking-widest mb-1 text-center">Registrasi</div>
                            <div className="text-3xl font-black text-white text-center">200RB</div>
                        </div>
                    </div>

                    {/* Packages Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* 15 Mbps */}
                        <div className="bg-white rounded-[2.5rem] p-6 shadow-xl text-center flex flex-col justify-between h-auto md:h-72 border-b-8 border-slate-200 group">
                            <div>
                                <div className="text-4xl mb-2">🕊️</div>
                                <div className="text-xs font-black text-slate-400 uppercase">Sederhana</div>
                                <div className="text-3xl font-black text-slate-900 tracking-tighter mt-1">15 Mbps</div>
                                <div className="text-blue-600 font-bold text-sm underline mt-2">Rp 150k / bln</div>
                                <ul className="text-slate-600 mt-4 font-bold italic text-xs space-y-2">
                                    <li>✅ Nonton YouTube Bening</li>
                                    <li>✅ Scroll TikTok Gak Mandeg</li>
                                </ul>
                            </div>
                            <a href="https://wa.me/6285852339600?text=Assalamualaikum%20Admin%20CiPUNK.NET%2C%0A%0ASaya%20tertarik%20untuk%20berlangganan%20internet%3A%0A%0A%F0%9F%93%A6%20*Paket%3A*%20Sederhana%20(15%20Mbps)%0A%F0%9F%92%B5%20*Harga%3A*%20Rp%20150.000%20%2F%20bulan%0A%0AMohon%20info%20cara%20pendaftarannya.%20Terima%20kasih." target="_blank" rel="noopener noreferrer" className="mt-4 w-full bg-slate-900 text-white font-black py-3 rounded-2xl text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-colors block text-center">
                                PILIH PAKET
                            </a>
                        </div>

                        {/* 30 Mbps */}
                        <div className="bg-blue-600 rounded-[2.5rem] p-6 shadow-2xl text-center flex flex-col justify-between h-auto md:h-80 md:-mt-4 border-4 border-yellow-400 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 bg-yellow-400 text-slate-900 px-3 py-1 text-[10px] font-black rounded-bl-xl">HOT</div>
                            <div>
                                <div className="text-4xl mb-2 mt-2 md:mt-4">🏆</div>
                                <div className="text-xs font-black text-blue-100 uppercase">Idaman</div>
                                <div className="text-3xl font-black text-white tracking-tighter mt-1">30 Mbps</div>
                                <div className="text-yellow-300 font-bold text-sm underline mt-2">Rp 200k / bln</div>
                                <ul className="text-white mt-4 font-bold italic text-xs space-y-2">
                                    <li>✅ Mabar Ping Ijo Terus</li>
                                    <li>✅ Satu Rumah Konek Sedoyo</li>
                                </ul>
                            </div>
                            <a href="https://wa.me/6285852339600?text=Assalamualaikum%20Admin%20CiPUNK.NET%2C%0A%0ASaya%20tertarik%20untuk%20berlangganan%20internet%3A%0A%0A%F0%9F%8F%86%20*Paket%3A*%20Idaman%20(30%20Mbps)%0A%F0%9F%92%B5%20*Harga%3A*%20Rp%20200.000%20%2F%20bulan%0A%0AMohon%20info%20cara%20pendaftarannya.%20Terima%20kasih." target="_blank" rel="noopener noreferrer" className="mt-4 w-full bg-white text-blue-600 font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest block hover:bg-slate-100 transition-colors text-center">
                                SAYA MAU!
                            </a>
                        </div>

                        {/* 50 Mbps */}
                        <div className="bg-white rounded-[2.5rem] p-6 shadow-xl text-center flex flex-col justify-between h-auto md:h-72 border-b-8 border-slate-200 group">
                            <div>
                                <div className="text-4xl mb-2">🌩️</div>
                                <div className="text-xs font-black text-slate-400 uppercase">Sultan</div>
                                <div className="text-3xl font-black text-slate-900 tracking-tighter mt-1">50 Mbps</div>
                                <div className="text-blue-600 font-bold text-sm underline mt-2">Rp 300k / bln</div>
                                <ul className="text-slate-600 mt-4 font-bold italic text-xs space-y-2">
                                    <li>✅ Kecepatan Dewa (No Limit)</li>
                                    <li>✅ Streaming 4K Gak Mikir</li>
                                </ul>
                            </div>
                            <a href="https://wa.me/6285852339600?text=Assalamualaikum%20Admin%20CiPUNK.NET%2C%0A%0ASaya%20tertarik%20untuk%20berlangganan%20internet%3A%0A%0A%F0%9F%8C%A9%EF%B8%8F%20*Paket%3A*%20Sultan%20(50%20Mbps)%0A%F0%9F%92%B5%20*Harga%3A*%20Rp%20300.000%20%2F%20bulan%0A%0AMohon%20info%20cara%20pendaftarannya.%20Terima%20kasih." target="_blank" rel="noopener noreferrer" className="mt-4 w-full bg-slate-900 text-white font-black py-3 rounded-2xl text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-colors block text-center">
                                PILIH PAKET
                            </a>
                        </div>
                    </div>
                </div>

                {/* Right Section */}
                <div className="md:col-span-4 flex flex-col gap-6">
                    {/* Billing Check */}
                    <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-[3rem] p-8 flex flex-col relative overflow-hidden flex-1">
                        <div className="absolute top-0 right-0 p-4 opacity-5 blur-xl pointer-events-none">
                            <i className="fas fa-wallet text-9xl"></i>
                        </div>
                        <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-4 relative z-10">LOKET TAGIHAN 💰</h2>
                        <div className="space-y-4 relative z-10">
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Masukkan No. WhatsApp</div>
                            <input 
                                type="text" 
                                value={phoneInput}
                                onChange={(e) => setPhoneInput(e.target.value)}
                                placeholder="08585233xxxx" 
                                className="w-full bg-white/10 border-2 border-white/10 rounded-2xl py-4 px-6 text-white font-bold focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-600"
                                onKeyDown={(e) => e.key === 'Enter' && cekTagihan()}
                            />
                            <button onClick={cekTagihan} className="w-full bg-yellow-400 text-slate-900 font-black py-4 rounded-2xl shadow-xl uppercase tracking-widest text-xs hover:bg-yellow-300 transition-colors active:scale-95">CEK TAGIHAN SAKNIKI</button>
                        </div>

                        {/* HASIL TAGIHAN DETAIL */}
                        {tagihan && (
                            <div id="tagihanResult" className="w-full mt-6 bg-white rounded-[2rem] shadow-2xl p-6 text-slate-800 animate-[fadeInUp_0.5s_ease] relative z-10">
                                <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-4">
                                    <div>
                                        <p className="text-blue-600 font-black text-[10px] uppercase tracking-widest mb-1">Invoice Internet</p>
                                        <h3 className="text-xl font-black uppercase italic leading-none">{tagihan.nama}</h3>
                                    </div>
                                    <div>
                                        {tagihan.lunas ? (
                                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black italic">LUNAS ✅</span>
                                        ) : (
                                            <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-[10px] font-black italic">BELUM BAYAR ⏳</span>
                                        )}
                                    </div>
                                </div>

                                {!tagihan.lunas && (
                                    <>
                                        <div className="bg-slate-50 rounded-2xl p-4 mb-6 space-y-2 font-bold italic text-slate-600 text-xs">
                                            <div className="flex justify-between"><span>Invoice:</span><span className="text-slate-900">{tagihan.inv}</span></div>
                                            <div className="flex justify-between"><span>Paket:</span><span className="text-slate-900">{tagihan.paket}</span></div>
                                            <div className="flex justify-between pt-2 border-t border-slate-200">
                                                <span>TOTAL:</span><span className="text-blue-600 text-sm">{tagihan.harga}</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 mb-4">
                                            <button onClick={() => setMetode('qris')} className={`border-2 py-2 rounded-xl font-black text-[9px] transition-all ${metode === 'qris' ? 'bg-blue-600 text-white border-blue-400' : 'bg-slate-100 border-transparent text-slate-600'}`}>📸 QRIS</button>
                                            <button onClick={() => setMetode('bca1')} className={`border-2 py-2 rounded-xl font-black text-[9px] transition-all ${metode === 'bca1' ? 'bg-blue-600 text-white border-blue-400' : 'bg-slate-100 border-transparent text-slate-600'}`}>🏦 BCA 1</button>
                                            <button onClick={() => setMetode('bca2')} className={`border-2 py-2 rounded-xl font-black text-[9px] transition-all ${metode === 'bca2' ? 'bg-blue-600 text-white border-blue-400' : 'bg-slate-100 border-transparent text-slate-600'}`}>🏦 BCA 2</button>
                                        </div>

                                        {metode === 'qris' && (
                                            <div className="text-center bg-slate-100 p-4 rounded-2xl border-2 border-dashed border-slate-300 animate-[fadeInUp_0.5s_ease]">
                                                <img src={qris} alt="QRIS" className="h-40 mx-auto mb-3 rounded-xl shadow border-4 border-white object-contain" />
                                                <button onClick={() => konfirmasiWA('QRIS')} className="w-full bg-blue-600 text-white font-black py-3 rounded-xl uppercase text-[10px] tracking-[0.2em] hover:bg-blue-700 transition">KIRIM BUKTI 🙏</button>
                                            </div>
                                        )}
                                        {metode === 'bca1' && (
                                            <div className="bg-blue-600 p-4 rounded-2xl text-white text-center animate-[fadeInUp_0.5s_ease]">
                                                <p className="text-[9px] font-bold opacity-80 uppercase">BCA</p>
                                                <h4 className="text-xl font-black my-1">6140996988</h4>
                                                <p className="text-[9px] font-bold opacity-80 uppercase mb-3">A/N SAIFUDIN</p>
                                                <button onClick={() => copyToClipboard('6140996988')} className="w-full bg-white/20 border border-white/30 text-white font-black py-2 rounded-xl mb-2 text-[10px] uppercase hover:bg-white/30 transition">Salin Rekening</button>
                                                <button onClick={() => konfirmasiWA('BCA 1')} className="w-full bg-slate-900 text-white font-black py-3 rounded-xl uppercase text-[10px] tracking-[0.2em] hover:bg-slate-800 transition">SAMPUN TRANSFER 🙏</button>
                                            </div>
                                        )}
                                        {metode === 'bca2' && (
                                            <div className="bg-pink-600 p-4 rounded-2xl text-white text-center animate-[fadeInUp_0.5s_ease]">
                                                <p className="text-[9px] font-bold opacity-80 uppercase">BCA</p>
                                                <h4 className="text-xl font-black my-1">1840773490</h4>
                                                <p className="text-[9px] font-bold opacity-80 uppercase mb-3">A/N DEWI MEGA SILVIA</p>
                                                <button onClick={() => copyToClipboard('1840773490')} className="w-full bg-white/20 border border-white/30 text-white font-black py-2 rounded-xl mb-2 text-[10px] uppercase hover:bg-white/30 transition">Salin Rekening</button>
                                                <button onClick={() => konfirmasiWA('BCA 2')} className="w-full bg-slate-900 text-white font-black py-3 rounded-xl uppercase text-[10px] tracking-[0.2em] hover:bg-slate-800 transition">SAMPUN TRANSFER 🙏</button>
                                            </div>
                                        )}
                                        <div className="mt-4 pt-4 border-t border-slate-200/50">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 text-center">Atau Unggah Bukti Transfer di Sini</p>
                                            <label className="block w-full bg-slate-200 border-2 border-dashed border-slate-300 rounded-xl py-3 text-center cursor-pointer hover:bg-slate-300 transition relative">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 block">
                                                    {uploadingBukti ? "Mengunggah..." : (tagihan.buktiTransfer ? "Ganti Bukti Transfer 🖼️" : "Upload Bukti 🖼️")}
                                                </span>
                                                <input type="file" accept="image/*" onChange={uploadBuktiTransfer} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={uploadingBukti} />
                                            </label>
                                            {tagihan.buktiTransfer && (
                                                <p className="text-center text-green-600 text-[10px] uppercase font-bold mt-2">✓ Bukti Transfer Sudah Masuk</p>
                                            )}
                                        </div>
                                    </>
                                )}

                                {tagihan.lunas && (
                                    <div className="text-center py-6 animate-[fadeInUp_0.5s_ease]">
                                        <div className="text-4xl mb-2 flex justify-center"><i className="fas fa-check-circle text-green-500"></i></div>
                                        <h3 className="text-lg font-black text-slate-800 italic uppercase">Lunas!</h3>
                                        <p className="text-slate-500 mt-2 italic font-bold text-xs">"Matur nuwun sanget sampun bayar tepat waktu."</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Quick Info Panel */}
                        <div className="mt-auto pt-6 relative z-10">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white/5 p-4 rounded-3xl border border-white/5">
                                    <div className="text-blue-500 text-2xl mb-1 text-center md:text-left">⚡</div>
                                    <div className="text-white font-bold text-xs uppercase text-center md:text-left">Sat-Set</div>
                                    <div className="text-[10px] text-slate-400 italic text-center md:text-left">Pasang secepat kilat</div>
                                </div>
                                <div className="bg-white/5 p-4 rounded-3xl border border-white/5">
                                    <div className="text-green-500 text-2xl mb-1 text-center md:text-left">🤝</div>
                                    <div className="text-white font-bold text-xs uppercase text-center md:text-left">Sopan</div>
                                    <div className="text-[10px] text-slate-400 italic text-center md:text-left">Teknisi kulo nuwun</div>
                                </div>
                            </div>
                            <div className="mt-6 pt-6 border-t border-white/10 text-center">
                                <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] italic mb-2">
                                    CiPUNK.NET &bull; SINYAL KUAT &bull; {new Date().getFullYear()}
                                </div>
                                <div className="text-[10px] text-slate-400 font-bold mb-4">
                                    Developer INFO: WA 085852339600 | Email: cipunknet@gmail.com
                                </div>
                                <button onClick={() => setView('admin_login')} className="bg-white/5 border border-white/10 text-blue-400 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition">
                                    Masuk Dasbor Admin
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
