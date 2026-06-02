import { db, storage } from "@/lib/firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc, query, where, serverTimestamp, Timestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";

export type DocumentType="license"|"malpractice"|"dea"|"npi"|"w9"|"board_cert"|"cv"|"other";
export type DocumentStatus="active"|"expiring_soon"|"expired";
export interface ProviderDocument { id?:string; companyId:string; providerId:string; providerName:string; type:DocumentType; name:string; fileName:string; fileUrl:string; storagePath:string; fileSize:number; expiryDate:string; status:DocumentStatus; notes:string; uploadedAt?:Timestamp; }
const COL="documents";
export async function getDocuments(companyId?:string,providerId?:string):Promise<ProviderDocument[]>{
  let q;
  if(companyId&&providerId) q=query(collection(db,COL),where("companyId","==",companyId),where("providerId","==",providerId));
  else if(companyId) q=query(collection(db,COL),where("companyId","==",companyId));
  else q=query(collection(db,COL));
  const snap=await getDocs(q);
  return snap.docs.map(d=>({id:d.id,...d.data()}as ProviderDocument)).sort((a,b)=>(b.uploadedAt?.seconds??0)-(a.uploadedAt?.seconds??0));
}
export async function addDocument(data:Omit<ProviderDocument,"id"|"uploadedAt">){ return addDoc(collection(db,COL),{...data,uploadedAt:serverTimestamp()}); }
export async function updateDocument(id:string,data:Partial<ProviderDocument>){ return updateDoc(doc(db,COL,id),data); }
export async function deleteDocument(id:string,storagePath:string){ await deleteDoc(doc(db,COL,id)); if(storagePath){try{await deleteObject(ref(storage,storagePath));}catch{}} }
export function uploadFile(file:File,path:string,onProgress:(pct:number)=>void):Promise<string>{ return new Promise((resolve,reject)=>{ const r=ref(storage,path); const t=uploadBytesResumable(r,file); t.on("state_changed",s=>onProgress(Math.round((s.bytesTransferred/s.totalBytes)*100)),reject,async()=>{const url=await getDownloadURL(t.snapshot.ref);resolve(url);}); }); }
export function getDocStatusFromExpiry(d:string):DocumentStatus{ if(!d)return"active"; const days=Math.ceil((new Date(d).getTime()-new Date().getTime())/86400000); return days<0?"expired":days<=90?"expiring_soon":"active"; }
export const DOC_TYPE_LABEL:Record<DocumentType,string>={license:"Medical License",malpractice:"Malpractice Insurance",dea:"DEA Certificate",npi:"NPI Letter",w9:"W-9 Form",board_cert:"Board Certification",cv:"Curriculum Vitae",other:"Other Document"};
