-- GrimoireSync 0.8.1 : progression, inventaire, quetes et metiers en lecture seule.
local addon, scan = CreateFrame("Frame"), CreateFrame("Frame")
local pendingInventory = false
local trackedQuestIDs={79976} -- fallback si l'API de liste complete n'est pas disponible

local function safe(fn, ...)
  if type(fn) ~= "function" then return nil end
  local values={pcall(fn,...)}
  if values[1] then return unpack(values,2) end
end
local function enc(v)
  return (tostring(v or ""):gsub("[^%w%-%._ ]",function(c)return string.format("%%%02X",string.byte(c))end))
end
local function now() return (type(time)=="function" and safe(time)) or 0 end
local function bagSlots(bag)
  if C_Container and C_Container.GetContainerNumSlots then return safe(C_Container.GetContainerNumSlots,bag) or 0 end
  return safe(GetContainerNumSlots,bag) or 0
end
local function bagItem(bag,slot)
  local link,count,quality,itemID
  if C_Container and C_Container.GetContainerItemInfo then
    local info=safe(C_Container.GetContainerItemInfo,bag,slot)
    if type(info)=="table" then link,count,quality,itemID=info.hyperlink,info.stackCount,info.quality,info.itemID end
  else
    local _,n,_,q,_,_,l=safe(GetContainerItemInfo,bag,slot); link,count,quality=l,n,q
  end
  if not link and type(GetContainerItemLink)=="function" then link=safe(GetContainerItemLink,bag,slot) end
  if not itemID and link then itemID=tonumber(link:match("item:(%d+)")) end
  if not itemID then return nil end
  local name,_,itemQuality,_,_,_,_,_,_,_,vendor=safe(GetItemInfo,itemID)
  return {id=itemID,count=count or 1,bag=bag,slot=slot,quality=quality or itemQuality or 0,vendor=vendor or 0,name=name or ("Objet "..itemID)}
end
local function captureInventory()
  GrimoireSyncDB.inventory={}
  for bag=0,4 do for slot=1,bagSlots(bag) do
    local item=bagItem(bag,slot); if item then table.insert(GrimoireSyncDB.inventory,item) end
  end end
  GrimoireSyncDB.inventoryTimestamp=now()
end
local function captureEquipment()
  GrimoireSyncDB.equipment={}
  for slot=1,19 do
    local link=safe(GetInventoryItemLink,"player",slot)
    local itemID=link and tonumber(link:match("item:(%d+)"))
    if itemID then
      local name,_,quality=safe(GetItemInfo,itemID)
      table.insert(GrimoireSyncDB.equipment,{id=itemID,slot=slot,quality=quality or 0,name=name or ("Objet "..itemID)})
    end
  end
end
local function captureQuestFlags()
  GrimoireSyncDB.completedTrackedQuests=GrimoireSyncDB.completedTrackedQuests or {}
  local list,api=nil,nil
  if C_QuestLog and type(C_QuestLog.GetAllCompletedQuestIDs)=="function" then
    list=safe(C_QuestLog.GetAllCompletedQuestIDs)
    if type(list)=="table" then api="C_QuestLog.GetAllCompletedQuestIDs" end
  end
  if type(list)~="table" and type(GetQuestsCompleted)=="function" then
    list=safe(GetQuestsCompleted)
    if type(list)=="table" then api="GetQuestsCompleted" end
  end
  if type(list)=="table" then
    local fresh,n={},0
    -- Newer clients return arrays of quest IDs; older ones return { [questID]=true }.
    for id,yes in pairs(list) do
      local questID=type(yes)=="number" and tonumber(yes) or (yes and tonumber(id))
      if questID and questID>0 and questID<10000000 then
        fresh[questID]=true
        n=n+1
        if n>=10000 then break end
      end
    end
    GrimoireSyncDB.completedTrackedQuests=fresh
    GrimoireSyncDB.questAPI=api or "completedList"
  else
    for _,id in ipairs(trackedQuestIDs) do
      if type(IsQuestFlaggedCompleted)=="function" and safe(IsQuestFlaggedCompleted,id) then
        GrimoireSyncDB.completedTrackedQuests[id]=true
      end
    end
    GrimoireSyncDB.questAPI=type(IsQuestFlaggedCompleted)=="function" and "IsQuestFlaggedCompleted" or "unavailable"
  end
end

local function captureQuestLog()
  local entries,status={}, "unavailable"
  local count=nil
  if C_QuestLog and type(C_QuestLog.GetNumQuestLogEntries)=="function" and type(C_QuestLog.GetInfo)=="function" then
    count=safe(C_QuestLog.GetNumQuestLogEntries)
    if type(count)=="number" then
      status="C_QuestLog.GetInfo"
      for i=1,math.min(count,100) do
        local info=safe(C_QuestLog.GetInfo,i)
        if type(info)=="table" and not info.isHeader then
          local id=tonumber(info.questID)
          if id and id>0 and id<10000000 then
            entries[#entries+1]={id=id,title=tostring(info.title or ("Quest "..id)),complete=info.isComplete==true}
          end
        end
      end
    end
  end
  if status=="unavailable" and type(GetNumQuestLogEntries)=="function" and type(GetQuestLogTitle)=="function" then
    count=safe(GetNumQuestLogEntries)
    if type(count)=="number" then
      status="GetQuestLogTitle"
      for i=1,math.min(count,100) do
        local title,level,tag,group,isHeader,collapsed,isComplete,frequency,id=safe(GetQuestLogTitle,i)
        if not isHeader and type(title)=="string" then
          id=tonumber(id) or (type(GetQuestLogQuestID)=="function" and safe(GetQuestLogQuestID,i))
          if tonumber(id) and tonumber(id)>0 then
            entries[#entries+1]={id=tonumber(id),title=title,complete=isComplete==true}
          end
        end
      end
    end
  end
  GrimoireSyncDB.activeQuests=entries
  GrimoireSyncDB.questLogAPI=status
end

local function captureProfessions()
  local previous=GrimoireSyncDB.professions or {}
  local result={}
  local count=safe(GetNumSkillLines) or 0
  local known={Alchemy=true,Blacksmithing=true,Enchanting=true,Engineering=true,Leatherworking=true,Tailoring=true,Cooking=true,["First Aid"]=true,Fishing=true,Mining=true,Herbalism=true,Skinning=true,Alchimie=true,Forge=true,Enchantement=true,Ingenierie=true,["Ingénierie"]=true,["Travail du cuir"]=true,Couture=true,Cuisine=true,["Premiers secours"]=true,["Pêche"]=true,Peche=true,Minage=true,Herboristerie=true,["Dépeçage"]=true,Depecage=true}
  for i=1,count do
    local name,isHeader,_,rank,_,_,maximum=safe(GetSkillLineInfo,i)
    if name and not isHeader and known[tostring(name)] and tonumber(rank) and tonumber(maximum) then
      result[tostring(name)]={rank=tonumber(rank),maximum=tonumber(maximum)}
    end
  end
  if next(result) then GrimoireSyncDB.professions=result
  else GrimoireSyncDB.professions=previous end
end
local function rebuildPayload()
  local c=GrimoireSyncDB.characters and GrimoireSyncDB.characters[GrimoireSyncDB.lastCharacter or ""] or {}
  local character=table.concat({enc(c.name),enc(c.realm),tonumber(c.level) or 0,enc(c.classToken),enc(c.raceToken),enc(c.faction),enc(c.zone),tonumber(c.gold) or 0,tonumber(c.timestamp) or 0,tonumber(c.xp) or 0,tonumber(c.xpMax) or 0,tonumber(c.restedXP) or 0},",")
  local inventory={}
  for _,item in ipairs(GrimoireSyncDB.inventory or {}) do
    inventory[#inventory+1]=table.concat({item.id,item.count,item.bag,item.slot,item.quality,item.vendor,enc(item.name)},",")
  end
  local equipment={}
  for _,item in ipairs(GrimoireSyncDB.equipment or {}) do
    equipment[#equipment+1]=table.concat({item.id,item.slot,item.quality,enc(item.name)},",")
  end
  local auctions={}
  for _,item in ipairs((GrimoireSyncDB.auction and GrimoireSyncDB.auction.items) or {}) do
    auctions[#auctions+1]=table.concat({item.id,item.count,item.buyout,item.unit,enc(item.name)},",")
  end
  local ah=GrimoireSyncDB.auction or {}
  local ahMeta=table.concat({enc(ah.realm),enc(ah.faction),tonumber(ah.timestamp) or 0,tonumber(ah.total) or 0},",")
  local prof={};for name,skill in pairs(GrimoireSyncDB.professions or {}) do prof[#prof+1]=table.concat({enc(name),tonumber(skill.rank) or 0,tonumber(skill.maximum) or 0},",") end
  table.sort(prof)
  local q={};for id,yes in pairs(GrimoireSyncDB.completedTrackedQuests or {}) do if yes then q[#q+1]=tonumber(id) end end
  table.sort(q)
  for i=1,#q do q[i]=tostring(q[i]) end
  local active={}
  for _,item in ipairs(GrimoireSyncDB.activeQuests or {}) do
    active[#active+1]=table.concat({tonumber(item.id) or 0,enc(item.title),item.complete and 1 or 0},",")
  end
  GrimoireSyncDB.payload="GF6|C:"..character.."|P:"..table.concat(prof,";").."|Q:"..table.concat(q,";").."|L:"..table.concat(active,";").."|LS:"..enc(GrimoireSyncDB.questLogAPI or "unavailable").."|I:"..table.concat(inventory,";").."|E:"..table.concat(equipment,";").."|AH:"..ahMeta.."|A:"..table.concat(auctions,";")
end
local function capture()
  GrimoireSyncDB=type(GrimoireSyncDB)=="table" and GrimoireSyncDB or {}
  local name,realm=safe(UnitFullName,"player"); if not name then name=safe(UnitName,"player") end
  realm=realm or safe(GetRealmName) or "Unknown"
  local class,classToken=safe(UnitClass,"player"); local race,raceToken=safe(UnitRace,"player")
  local zone=safe(GetRealZoneText) or safe(GetZoneText) or "Unknown"
  local build,buildNumber,_,interfaceVersion=safe(GetBuildInfo); local key=tostring(name or "Unknown").."-"..tostring(realm)
  GrimoireSyncDB.schema=6; GrimoireSyncDB.lastCharacter=key; GrimoireSyncDB.characters=GrimoireSyncDB.characters or {}
  GrimoireSyncDB.characters[key]={name=name or "Unknown",realm=realm,level=safe(UnitLevel,"player") or 0,class=class or "Unknown",classToken=classToken or "UNKNOWN",race=race or "Unknown",raceToken=raceToken or "UNKNOWN",faction=safe(UnitFactionGroup,"player") or "Unknown",zone=zone,gold=safe(GetMoney) or 0,xp=safe(UnitXP,"player") or 0,xpMax=safe(UnitXPMax,"player") or 0,restedXP=safe(GetXPExhaustion) or 0,client=build or "Unknown",build=buildNumber or "",interface=tonumber(interfaceVersion) or 0,timestamp=now()}
  captureInventory(); captureEquipment(); captureProfessions(); captureQuestFlags(); captureQuestLog(); rebuildPayload()
end
-- Capture XP legere : ne rescane pas les sacs et quetes a chaque gain d'XP.
-- /reload persiste les SavedVariables sur disque, un import navigateur reste requis.
local function captureXP()
  if type(GrimoireSyncDB)~="table" then return end
  local key=GrimoireSyncDB.lastCharacter
  local c=key and GrimoireSyncDB.characters and GrimoireSyncDB.characters[key]
  if type(c)~="table" then return end
  local current=safe(UnitXP,"player")
  local maximum=safe(UnitXPMax,"player")
  if type(current)=="number" and type(maximum)=="number" and maximum>0 and current>=0 and current<=maximum then
    c.xp=current
    c.xpMax=maximum
    c.restedXP=safe(GetXPExhaustion) or 0
    c.timestamp=now()
    GrimoireSyncDB.xpStatus="ok"
  else
    -- Zero seul ne signifie pas absence de donnees; ne pas faire croire
    -- qu'une valeur estimee est une XP vraiment synchronisee.
    c.xp=nil
    c.xpMax=nil
    GrimoireSyncDB.xpStatus="unavailable"
  end
  rebuildPayload()
end

local function finishAuction(items)
  GrimoireSyncDB.auction={realm=safe(GetRealmName) or "Unknown",faction=safe(UnitFactionGroup,"player") or "Unknown",timestamp=now(),items=items or {},total=#(items or {})}
  rebuildPayload()
  print("|cffd9b56cGrimoireSync|r : scan termine, "..#(items or {}).." annonces observees. /reload pour les transmettre au compagnon.")
end
local function readReplicate()
  local items={}; local total=C_AuctionHouse and safe(C_AuctionHouse.GetNumReplicateItems) or 0
  for i=0,(tonumber(total) or 0)-1 do
    local name,_,count,_,_,_,_,_,_,buyout,_,_,_,_,_,_,id=safe(C_AuctionHouse.GetReplicateItemInfo,i)
    local link=safe(C_AuctionHouse.GetReplicateItemLink,i)
    id=tonumber(id) or (link and tonumber(link:match("item:(%d+)")))
    if id and buyout and buyout>0 then
      name=name or safe(GetItemInfo,id) or ("Objet "..id); count=tonumber(count) or 1
      items[#items+1]={id=id,count=count,buyout=buyout,unit=math.floor(buyout/math.max(1,count)),name=name}
    end
  end
  finishAuction(items)
end
local function readLegacy()
  local items={}; local total=safe(GetNumAuctionItems,"list") or 0
  for i=1,(tonumber(total) or 0) do
    local name,_,count,_,_,_,_,_,_,buyout=safe(GetAuctionItemInfo,"list",i)
    local link=safe(GetAuctionItemLink,"list",i); local id=link and tonumber(link:match("item:(%d+)"))
    if id and buyout and buyout>0 then count=tonumber(count) or 1; items[#items+1]={id=id,count=count,buyout=buyout,unit=math.floor(buyout/math.max(1,count)),name=name or ("Objet "..id)} end
  end
  finishAuction(items)
end
local function startAuctionScan()
  if not AuctionHouseFrame and not AuctionFrame then print("|cffff7777GrimoireSync|r : ouvre d'abord l'hotel des ventes."); return end
  if C_AuctionHouse and C_AuctionHouse.ReplicateItems then
    local ok=safe(C_AuctionHouse.ReplicateItems); if ok==false then print("|cffffcc66GrimoireSync|r : scan indisponible pour le moment (limite du serveur)."); return end
    print("|cffd9b56cGrimoireSync|r : scan de l'hotel des ventes lance...")
  elseif type(QueryAuctionItems)=="function" then safe(QueryAuctionItems,"",nil,nil,0,false,nil,true); print("|cffd9b56cGrimoireSync|r : scan classique lance...")
  else print("|cffff7777GrimoireSync|r : API de scan inconnue. Utilise /grimoire debug.") end
end

for _,event in ipairs({"PLAYER_LOGIN","PLAYER_LEVEL_UP","PLAYER_XP_UPDATE","UPDATE_EXHAUSTION","ZONE_CHANGED_NEW_AREA","PLAYER_MONEY","BAG_UPDATE_DELAYED","PLAYER_LOGOUT","QUEST_TURNED_IN","QUEST_LOG_UPDATE","SKILL_LINES_CHANGED"}) do
  -- Custom clients may omit individual events: skip them rather than abort loading.
  pcall(addon.RegisterEvent,addon,event)
end
addon:SetScript("OnEvent",function(_,event,unit)
  if event=="PLAYER_XP_UPDATE" or event=="UPDATE_EXHAUSTION" then
    captureXP()
  elseif event=="BAG_UPDATE_DELAYED" and C_Timer and C_Timer.After then
    if pendingInventory then return end; pendingInventory=true
    C_Timer.After(0.5,function()pendingInventory=false;capture()end)
  else capture() end
end)
-- WoW Forever 1.6.0.1 does not expose AUCTION_ITEM_LIST_UPDATE.
-- Register supported auction events defensively; a missing optional event
-- must never prevent the slash command and character capture from loading.
local function registerOptionalEvent(frame,event)
  local ok=pcall(frame.RegisterEvent,frame,event)
  return ok
end
registerOptionalEvent(scan,"REPLICATE_ITEM_LIST_UPDATE")
scan:SetScript("OnEvent",function(_,event)if event=="REPLICATE_ITEM_LIST_UPDATE" then readReplicate() else readLegacy() end end)

SLASH_GRIMOIRESYNC1="/grimoire"
SlashCmdList.GRIMOIRESYNC=function(message)
  message=(message or ""):lower():match("^%s*(.-)%s*$")
  if message=="scan" then startAuctionScan(); return end
  if message=="minimap reset" then
    if type(GrimoireSyncResetMinimap)=="function" and GrimoireSyncResetMinimap() then
      print("|cffd9b56cGrimoireSync|r : position de la mini-carte restauree. /reload pour enregistrer.")
    else
      print("|cffff7777GrimoireSync|r : bouton de mini-carte indisponible.")
    end
    return
  end
  capture()
  if message=="debug" then print("GrimoireSync schema="..tostring(GrimoireSyncDB.schema).." quetes="..tostring((function()local n=0 for _ in pairs(GrimoireSyncDB.completedTrackedQuests or {}) do n=n+1 end return n end)()).." API_QUETES="..tostring(GrimoireSyncDB.questAPI).." JOURNAL="..tostring(GrimoireSyncDB.questLogAPI).." ACTIVES="..tostring(#(GrimoireSyncDB.activeQuests or {})).." inventaire="..tostring(#(GrimoireSyncDB.inventory or {})).." API_AH="..tostring(C_AuctionHouse and C_AuctionHouse.ReplicateItems~=nil).." XP="..tostring(safe(UnitXP,"player")).."/"..tostring(safe(UnitXPMax,"player")).." statut="..tostring(GrimoireSyncDB.xpStatus or "capture initiale")); return end
  print("|cffd9b56cGrimoireSync|r : "..tostring(GrimoireSyncDB.lastCharacter)..", "..#(GrimoireSyncDB.inventory or {}).." piles dans les sacs.")
  print("|cffd9b56cGrimoireSync|r : ouvre l'hotel des ventes puis tape |cffffffff/grimoire scan|r. /reload enregistre les donnees.")
end

