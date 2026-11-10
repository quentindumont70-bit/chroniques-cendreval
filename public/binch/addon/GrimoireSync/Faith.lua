-- Faith / La Binch: companion local in-game. UI + supported events only.
-- No network, microphone, combat automation or file-system access.
local frame=CreateFrame("Frame","GrimoireFaithEvents",UIParent)
local label="|cff8ad9d1Faith|r"
local state={lastDeath=-100000,lastLevel=-100000,deaths=0,seenDeath=false}
local win,output,input,launcher
local function clock()
  if type(GetTime)=="function" then return GetTime() or 0 end
  return 0
end
local function setting()
  GrimoireSyncDB=type(GrimoireSyncDB)=="table" and GrimoireSyncDB or {}
  local p=GrimoireSyncDB.faithPrefs
  if type(p)~="table" then p={enabled=true,mood="taquin",quietInInstance=true};GrimoireSyncDB.faithPrefs=p end
  if p.enabled==nil then p.enabled=true end
  if p.mood~="taquin" and p.mood~="sobre" and p.mood~="silence" then p.mood="taquin" end
  if p.quietInInstance==nil then p.quietInInstance=true end
  return p
end
local function instance()
  if type(IsInInstance)~="function" then return false end
  local ok,value=pcall(IsInInstance)
  return ok and value==true
end
local function speak(message,spontaneous)
  local p=setting()
  if spontaneous and (not p.enabled or p.mood=="silence" or (p.quietInInstance and instance())) then return end
  if DEFAULT_CHAT_FRAME then DEFAULT_CHAT_FRAME:AddMessage(label.." : "..message) end
  if output and win and win:IsShown() then output:SetText(message) end
end
local function response(query)
  local q=string.lower(tostring(query or ""))
  if q=="" or q=="help" or q=="aide" then
    return "Demande : niveau, zone, classe, mort, quetes, metiers, equipement, sync. /faith mode taquin|sobre|silence ; /faith on|off ; /faith instance on|off. Pour des reponses encyclopediques, le compagnon Windows est encore a construire."
  end
  if string.find(q,"niveau",1,true) or string.find(q,"level",1,true) then
    local level=type(UnitLevel)=="function" and UnitLevel("player") or "?"
    return "Niveau "..tostring(level)..". Je vois ton niveau actuel dans le client, pas ta progression vers les quetes futures."
  end
  if string.find(q,"zone",1,true) then
    local zone=type(GetRealZoneText)=="function" and GetRealZoneText() or "inconnue"
    return "Nous sommes en "..tostring(zone)..". Un itineraire fiable exige la base de connaissances WoW Forever, pas une divination."
  end
  if string.find(q,"classe",1,true) then
    local name=type(UnitClass)=="function" and UnitClass("player") or "inconnue"
    return "Tu joues "..tostring(name)..". Les talents et rotations precises doivent venir d'une source validee sur Forever."
  end
  if string.find(q,"mort",1,true) or string.find(q,"rez",1,true) then
    return "J'ai compte "..tostring(state.deaths).." mort(s) durant cette session. Ce compteur n'est pas un historique officiel."
  end
  if string.find(q,"quete",1,true) or string.find(q,"quest",1,true) then
    return "Pour l'instant, les quetes detaillees passent par GrimoireSync et La Binch apres /reload et import. Je n'invente pas un objectif de quete."
  end
  if string.find(q,"metier",1,true) or string.find(q,"equip",1,true) then
    return "Les metiers et pieces d'armure sont suivis par GrimoireSync. Consulte l'Arsenal et le Codex de La Binch apres une sauvegarde."
  end
  if string.find(q,"sync",1,true) or string.find(q,"reload",1,true) then
    return "Un /reload enregistre tes SavedVariables ; le compagnon ou le navigateur doivent ensuite les lire avec ton accord. Pas de liaison directe en temps reel."
  end
  return "La question est entendue, mais mon moteur local ne sait pas encore y repondre avec certitude. Aucun serveur IA n'est connecte dans le jeu. Essaye /faith aide."
end
local function ask(query)
  query=tostring(query or "")
  if string.len(query)>240 then query=string.sub(query,1,240) end
  speak(response(query),false)
end
local function controls()
  win=CreateFrame("Frame","GrimoireFaithWindow",UIParent)
  win:SetWidth(340);win:SetHeight(192)
  win:SetPoint("CENTER",UIParent,"CENTER",0,70)
  win:SetFrameStrata("DIALOG");win:SetMovable(true);win:EnableMouse(true)
  win:RegisterForDrag("LeftButton")
  win:SetScript("OnDragStart",function(self)self:StartMoving()end)
  win:SetScript("OnDragStop",function(self)self:StopMovingOrSizing()end)
  local bg=win:CreateTexture(nil,"BACKGROUND")
  bg:SetAllPoints(win);bg:SetTexture(0.06,0.14,0.18,0.96)
  local icon=win:CreateTexture(nil,"ARTWORK")
  icon:SetTexture("Interface\\Icons\\Spell_Nature_Lightning");icon:SetWidth(34);icon:SetHeight(34);icon:SetPoint("TOPLEFT",win,"TOPLEFT",12,-12)
  local title=win:CreateFontString(nil,"OVERLAY","GameFontNormalLarge")
  title:SetPoint("LEFT",icon,"RIGHT",9,0);title:SetText("Faith - esprit du chaman")
  local close=CreateFrame("Button",nil,win,"UIPanelCloseButton")
  close:SetPoint("TOPRIGHT",win,"TOPRIGHT",0,0)
  output=win:CreateFontString(nil,"OVERLAY","GameFontHighlightSmall")
  output:SetWidth(312);output:SetHeight(70)
  output:SetJustifyH("LEFT");output:SetJustifyV("TOP")
  output:SetPoint("TOPLEFT",win,"TOPLEFT",14,-57)
  output:SetText("Bien le bonjour, patron. Pose ta question. Je ne suis encore qu'une incarnation locale.")
  input=CreateFrame("EditBox",nil,win,"InputBoxTemplate")
  input:SetWidth(220);input:SetHeight(24);input:SetAutoFocus(false)
  input:SetMaxLetters(240);input:SetPoint("BOTTOMLEFT",win,"BOTTOMLEFT",18,19)
  local send=CreateFrame("Button",nil,win,"UIPanelButtonTemplate")
  send:SetWidth(77);send:SetHeight(24);send:SetPoint("LEFT",input,"RIGHT",8,0)
  send:SetText("Parler")
  local function submit()
    local text=input:GetText() or "";input:SetText("");input:ClearFocus()
    if text~="" then ask(text) end
  end
  input:SetScript("OnEnterPressed",submit)
  input:SetScript("OnEscapePressed",function()input:ClearFocus();win:Hide()end)
  send:SetScript("OnClick",submit)
  win:Hide()
  launcher=CreateFrame("Button","GrimoireFaithButton",UIParent,"UIPanelButtonTemplate")
  launcher:SetWidth(74);launcher:SetHeight(22);launcher:SetPoint("CENTER",UIParent,"CENTER",0,-145)
  launcher:SetText("Faith")
  launcher:SetMovable(true);launcher:EnableMouse(true);launcher:RegisterForDrag("LeftButton")
  launcher:SetScript("OnDragStart",function(self)self:StartMoving()end)
  launcher:SetScript("OnDragStop",function(self)self:StopMovingOrSizing()end)
  launcher:SetScript("OnClick",function()if win:IsShown()then win:Hide()else win:Show()end end)
  -- Opt in to showing Faith. /faith on enables the anchor and reactions.
  launcher:Hide()
end
local deaths={
  "Une mort heroique, patron. L'ennemi n'a pas l'air convaincu.",
  "Les esprits ont une nouvelle chaise pour toi. Encore.",
  "Pour la discretion, mourir devant tout le monde reste un choix discutable.",
  "Tu voulais voir le cimetiere ? La visite est gratuite."
}
local levels={
  "Un niveau de plus ! Meme les ancetres reconnaissent le progres.",
  "Tu progresses, patron. Je garde mon sarcasme en reserve."
}
local function chatter(lines,count)
  local p=setting()
  if p.mood=="sobre" then return count==1 and "La mort fait partie du chemin. Reprends ta route." or "Niveau atteint. Continue." end
  return lines[(count-1)%#lines+1]
end
local function command(msg)
  msg=string.gsub(tostring(msg or ""),"^%s+","")
  msg=string.gsub(msg,"%s+$","")
  local lower=string.lower(msg)
  if lower=="on" then setting().enabled=true;if launcher then launcher:Show()end;speak("Mode actif. /faith ouvre le dialogue.",false);return end
  if lower=="off" then setting().enabled=false;if launcher then launcher:Hide()end;if win then win:Hide()end;speak("Reactions desactivees. /faith on pour revenir.",false);return end
  local mood=string.match(lower,"^mode%s+(%S+)$")
  if mood then if mood=="taquin" or mood=="sobre" or mood=="silence" then setting().mood=mood;speak("Ton choisi : "..mood..".",false)else speak("Modes : taquin, sobre, silence.",false)end;return end
  local inst=string.match(lower,"^instance%s+(%S+)$")
  if inst then if inst=="on" or inst=="off" then setting().quietInInstance=inst=="on";speak("Silence en instance : "..inst..".",false)end;return end
  if lower=="" then if win then if win:IsShown() then win:Hide()else win:Show()end end;return end
  ask(msg)
end
SLASH_GRIMOIREFAITH1="/faith"
SlashCmdList.GRIMOIREFAITH=command
for _,event in ipairs({"PLAYER_LOGIN","PLAYER_DEAD","PLAYER_LEVEL_UP","PLAYER_ALIVE","PLAYER_UNGHOST"}) do pcall(frame.RegisterEvent,frame,event) end
frame:SetScript("OnEvent",function(_,event,...)
  if event=="PLAYER_LOGIN" then
    controls()
    if setting().enabled then launcher:Show()end
    speak("Je suis la, patron. /faith pour me parler, /faith aide pour mes limites.",false)
  elseif event=="PLAYER_DEAD" then
    if state.seenDeath or clock()-state.lastDeath<25 then return end
    state.seenDeath=true;state.lastDeath=clock();state.deaths=state.deaths+1
    speak(chatter(deaths,1),true)
  elseif event=="PLAYER_ALIVE" or event=="PLAYER_UNGHOST" then
    if type(UnitIsDeadOrGhost)=="function" and not UnitIsDeadOrGhost("player") then state.seenDeath=false end
  elseif event=="PLAYER_LEVEL_UP" then
    if clock()-state.lastLevel<3 then return end
    state.lastLevel=clock()
    speak(chatter(levels,2),true)
  end
end)
