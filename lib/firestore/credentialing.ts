import { db } from "@/lib/firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc, query, where, serverTimestamp, Timestamp } from "firebase/firestore";

export type CredentialingStatus = "pending"|"in_progress"|"approved"|"expired"|"rejected";
export interface PayerEnrollment { payerName:string; payerId:string; status:"not_started"|"submitted"|"approved"|"rejected"; submittedDate:string; approvedDate:string; notes:string; }
export interface Credentialing { id?:string; companyId:string; providerId:string; providerName:string; npi:string; licenseNumber:string; licenseState:string; licenseExpiry:string; deaNumber:string; deaExpiry:string; malpracticeInsurer:string; malpracticeExpiry:string; malpracticePolicyNumber:string; boardCertification:string; boardExpiry:string; payers:PayerEnrollment[]; status:CredentialingStatus; notes:string; createdAt?:Timestamp; updatedAt?:Timestamp; }
const COL="credentialing";
export async function getCredentialings(companyId?:string):Promise<Credentialing[]>{
  const q=companyId?query(collection(db,COL),where("companyId","==",companyId)):query(collection(db,COL));
  const snap=await getDocs(q);
  return snap.docs.map(d=>({id:d.id,...d.data()}as Credentialing)).sort((a,b)=>(b.createdAt?.seconds??0)-(a.createdAt?.seconds??0));
}
export async function getCredentialing(id:string):Promise<Credentialing|null>{ const snap=await getDoc(doc(db,COL,id)); return snap.exists()?({id:snap.id,...snap.data()}as Credentialing):null; }
export async function getCredentialingByProvider(providerId:string):Promise<Credentialing|null>{ const q=query(collection(db,COL),where("providerId","==",providerId)); const snap=await getDocs(q); if(snap.empty)return null; return{id:snap.docs[0].id,...snap.docs[0].data()}as Credentialing; }
export async function addCredentialing(data:Omit<Credentialing,"id"|"createdAt"|"updatedAt">){ return addDoc(collection(db,COL),{...data,createdAt:serverTimestamp(),updatedAt:serverTimestamp()}); }
export async function updateCredentialing(id:string,data:Partial<Credentialing>){ return updateDoc(doc(db,COL,id),{...data,updatedAt:serverTimestamp()}); }
export async function deleteCredentialing(id:string){ return deleteDoc(doc(db,COL,id)); }
export function getExpiryStatus(d:string):"expired"|"expiring_soon"|"valid"|"none"{ if(!d)return"none"; const days=Math.ceil((new Date(d).getTime()-new Date().getTime())/86400000); return days<0?"expired":days<=90?"expiring_soon":"valid"; }
export function daysUntilExpiry(d:string):number{ if(!d)return 0; return Math.ceil((new Date(d).getTime()-new Date().getTime())/86400000); }
