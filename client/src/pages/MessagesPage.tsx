import React from 'react';
import { Archive, ChevronLeft, Mail, MessageCircle, Phone, Search, Send, X } from 'lucide-react';
import { api, formatDate } from '../lib/api';

interface ContactMessage { _id:string; name:string; email:string; phone?:string; vehicle?:{year?:string;make?:string;model?:string}; services?:string[]; subject:string; message:string; status:'new'|'read'|'archived'; createdAt:string; replies?:Array<{body:string;sentAt:string;sentBy?:string}>; }
type Filter='inbox'|'new'|'archived';

const normalizePhone=(phone:string)=>phone.replace(/[^\d+]/g,'');
const formatPhone=(phone:string)=>{ const digits=phone.replace(/\D/g,''); const value=digits.length===11&&digits.startsWith('1')?digits.slice(1):digits; return value.length===10?`(${value.slice(0,3)}) ${value.slice(3,6)}-${value.slice(6)}`:phone; };

const MessagesPage:React.FC=()=>{
  const [messages,setMessages]=React.useState<ContactMessage[]>([]);
  const [selectedId,setSelectedId]=React.useState<string|null>(null);
  const [filter,setFilter]=React.useState<Filter>('inbox');
  const [query,setQuery]=React.useState('');
  const [replyBody,setReplyBody]=React.useState('');
  const [isComposing,setIsComposing]=React.useState(false);
  const [sending,setSending]=React.useState(false);
  const [error,setError]=React.useState('');
  const [success,setSuccess]=React.useState('');

  const loadMessages=React.useCallback(async()=>{ try { const response=await api.get('/contact'); const next=response.data.messages||[]; setMessages(next); setSelectedId(current=>current&&next.some((item:ContactMessage)=>item._id===current)?current:(next[0]?._id||null)); } catch(error:any){setError(error.response?.data?.error||'Could not load messages');} },[]);
  React.useEffect(()=>{void loadMessages();},[loadMessages]);

  const visibleMessages=React.useMemo(()=>messages.filter(item=>{
    const matchesFilter=filter==='inbox'?item.status!=='archived':filter==='new'?item.status==='new':item.status==='archived';
    const searchable=`${item.name} ${item.email} ${item.phone||''} ${item.subject} ${item.message} ${item.services?.join(' ')||''} ${item.vehicle?.year||''} ${item.vehicle?.make||''} ${item.vehicle?.model||''}`.toLowerCase();
    return matchesFilter&&searchable.includes(query.trim().toLowerCase());
  }),[messages,filter,query]);
  const selected=messages.find(item=>item._id===selectedId)||null;
  const newCount=messages.filter(item=>item.status==='new').length;

  const updateStatus=async(id:string,status:ContactMessage['status'])=>{ try { await api.patch(`/contact/${id}`,{status}); setMessages(current=>current.map(item=>item._id===id?{...item,status}:item)); } catch(error:any){setError(error.response?.data?.error||'Could not update message');} };
  const openMessage=(item:ContactMessage)=>{ setSelectedId(item._id); setIsComposing(false); setReplyBody(''); setSuccess(''); if(item.status==='new')void updateStatus(item._id,'read'); };
  const sendReply=async()=>{ if(!selected||!replyBody.trim()){setError('Write a reply before sending.');return;} setSending(true);setError('');setSuccess(''); try { await api.post(`/contact/${selected._id}/reply`,{body:replyBody.trim()}); setReplyBody('');setIsComposing(false);setSuccess(`Reply sent to ${selected.name}.`);await loadMessages(); } catch(error:any){setError(error.response?.data?.error||'Could not send the email.');} finally{setSending(false);} };
  return <main className="admin-page messages-page">
    <header className="admin-page-header"><div><div className="admin-kicker">Customer communication</div><h1 className="admin-title">Messages</h1><p className="admin-subtitle">Website questions and service requests in one place.</p></div>
      <div className="messages-summary"><span><strong>{newCount}</strong> unread</span><span><strong>{messages.length}</strong> total</span></div>
    </header>
    {error&&<div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}<button onClick={()=>setError('')} className="float-right" aria-label="Dismiss"><X size={16}/></button></div>}
    {success&&<div className="mb-4 rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div>}

    <div className={`inbox-shell admin-panel ${selected?'has-selection':''}`}>
      <aside className="inbox-sidebar">
        <div className="inbox-toolbar">
          <div className="inbox-filters" role="tablist" aria-label="Message filters">
            {([['inbox','Inbox'],['new','Unread'],['archived','Archived']] as const).map(([value,label])=><button key={value} type="button" className={filter===value?'active':''} onClick={()=>setFilter(value)}>{label}{value==='new'&&newCount>0?<span>{newCount}</span>:null}</button>)}
          </div>
          <label className="message-search"><Search size={16}/><span className="sr-only">Search messages</span><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search messages"/></label>
        </div>
        <div className="message-list">
          {visibleMessages.length===0?<div className="empty-inbox"><Mail size={28}/><strong>No messages here</strong><span>New website inquiries will appear in this inbox.</span></div>:visibleMessages.map(item=><button type="button" key={item._id} className={`message-row ${selectedId===item._id?'selected':''} ${item.status==='new'?'unread':''}`} onClick={()=>openMessage(item)}>
            <span className="message-avatar">{item.name.charAt(0).toUpperCase()}</span><span className="message-preview"><span className="message-row-top"><strong>{item.name}</strong><time>{new Date(item.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</time></span><span className="message-subject">{item.subject}</span><span className="message-snippet">{item.message}</span></span>{item.status==='new'?<span className="unread-dot"/>:null}
          </button>)}
        </div>
      </aside>

      <section className="message-detail">
        {!selected?<div className="message-placeholder"><Mail size={34}/><h2>Select a message</h2><p>Choose a conversation to read and reply.</p></div>:<>
          <header className="message-detail-header"><button type="button" className="mobile-back" onClick={()=>setSelectedId(null)} aria-label="Back to messages"><ChevronLeft/></button><div><span className={`message-status status-${selected.status}`}>{selected.status}</span><h2>{selected.subject}</h2><p>From <strong>{selected.name}</strong> · {formatDate(selected.createdAt)}</p></div>
            <select value={selected.status} onChange={event=>void updateStatus(selected._id,event.target.value as ContactMessage['status'])} aria-label="Message status"><option value="new">Unread</option><option value="read">Read</option><option value="archived">Archived</option></select>
          </header>
          <div className="message-contact-bar"><a href={`mailto:${selected.email}`}><Mail size={15}/>{selected.email}</a>{selected.phone?<><a href={`tel:${normalizePhone(selected.phone)}`}><Phone size={15}/>{formatPhone(selected.phone)}</a><a href={`sms:${normalizePhone(selected.phone)}`}><MessageCircle size={15}/>Text</a></>:null}</div>
          <div className="conversation">{((selected.services?.length||0)>0||selected.vehicle?.year||selected.vehicle?.make||selected.vehicle?.model)&&<div className="request-context"><div><span>Vehicle</span><strong>{[selected.vehicle?.year,selected.vehicle?.make,selected.vehicle?.model].filter(Boolean).join(' ')||'Not provided'}</strong></div><div><span>Requested service</span><strong>{selected.services?.length?selected.services.join(', '):'Not selected'}</strong></div></div>}<article className="conversation-message incoming"><div className="conversation-meta"><span className="message-avatar">{selected.name.charAt(0).toUpperCase()}</span><div><strong>{selected.name}</strong><span>{formatDate(selected.createdAt)}</span></div></div><p>{selected.message}</p></article>
            {selected.replies?.map((reply,index)=><article className="conversation-message outgoing" key={`${reply.sentAt}-${index}`}><div className="conversation-meta"><span className="message-avatar owner">T</span><div><strong>Terry's Auto Service</strong><span>{formatDate(reply.sentAt)}</span></div></div><p>{reply.body}</p></article>)}
          </div>
          <footer className="reply-area">{isComposing?<div className="reply-composer"><label htmlFor="message-reply">Reply to {selected.name}</label><textarea id="message-reply" rows={5} autoFocus value={replyBody} onChange={event=>setReplyBody(event.target.value)} placeholder={`Hi ${selected.name},`}/><div><button type="button" className="admin-button-primary" onClick={()=>void sendReply()} disabled={sending||!replyBody.trim()}><Send size={16}/>{sending?'Sending…':'Send email'}</button><button type="button" className="admin-button-secondary" onClick={()=>{setIsComposing(false);setReplyBody('');}} disabled={sending}>Cancel</button></div></div>:<div className="reply-actions">
            <button type="button" className="admin-button-primary" onClick={()=>{setIsComposing(true);setReplyBody(`Hi ${selected.name},\n\n`);}}><Send size={16}/>Reply in dashboard</button>
            <a className="admin-button-secondary" href={`mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${selected.subject}`)}&body=${encodeURIComponent(`Hi ${selected.name},\n\n\n\n--- Original website message ---\n${selected.message}`)}`}><Mail size={16}/>Open email app</a>
            {selected.phone?<><a className="admin-button-secondary" href={`sms:${normalizePhone(selected.phone)}`}><MessageCircle size={16}/>Text customer</a><a className="admin-button-secondary" href={`tel:${normalizePhone(selected.phone)}`}><Phone size={16}/>Call customer</a></>:null}
            {selected.status!=='archived'?<button type="button" className="admin-button-secondary" onClick={()=>void updateStatus(selected._id,'archived')}><Archive size={16}/>Archive</button>:null}
          </div>}</footer>
        </>}
      </section>
    </div>
  </main>;
};

export default MessagesPage;
