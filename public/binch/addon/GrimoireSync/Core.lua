-- GrimoireSync 0.6.0 : inventaire, quetes validees et hotel des ventes en lecture seule.
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
local function captureQuestFlags()
  GrimoireSyncDB.completedTrackedQuests=GrimoireSyncDB.completedTrackedQuests or {}
  local list=nil
  if type(GetQuestsCompleted)=="function" then list=safe(GetQuestsCompleted) end
  if type(list)=="table" then
    -- Les identifiants sont locaux : aucune requete reseau ni modification de quete.
    -- Remplacer l'etat par le dernier instantane confirme de l'API du client.
    local fresh={}
    local n=0
    for id,yes in pairs(list) do
      local questID=tonumber(id)
      if yes and questID and questID>0 and questID<10000000 then
        fresh[questID]=true
        n=n+1
        if n>=10000 then break end
      end
    end
    GrimoireSyncDB.completedTrackedQuests=fresh
    GrimoireSyncDB.questAPI="GetQuestsCompleted"
  else
    -- Conserver les validations anciennes et tester quelques IDs connus.
    for _,id in ipairs(trackedQuestIDs) do
      if type(IsQuestFlaggedCompleted)=="function" and safe(IsQuestFlaggedCompleted,id) then
        GrimoireSyncDB.completedTrackedQuests[id]=true
      end
    end
    GrimoireSyncDB.questAPI=type(IsQuestFlaggedCompleted)=="function" and "IsQuestFlaggedCompleted" or "unavailable"
  end
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
  local character=table.concat({enc(c.name),enc(c.realm),tonumber(c.level) or 0,enc(c.classToken),enc(c.raceToken),enc(c.faction),enc(c.zone),tonumber(c.gold) or 0,tonumber(c.timestamp) or 0},",")
  local inventory={}
  for _,item in ipairs(GrimoireSyncDB.inventory or {}) do
    inventory[#inventory+1]=table.concat({item.id,item.count,item.bag,item.slot,item.quality,item.vendor,enc(item.name)},",")
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
  GrimoireSyncDB.payload="GF5|C:"..character.."|P:"..table.concat(prof,";").."|Q:"..table.concat(q,";").."|I:"..table.concat(inventory,";").."|AH:"..ahMeta.."|A:"..table.concat(auctions,";")
end
local function capture()
  GrimoireSyncDB=type(GrimoireSyncDB)=="table" and GrimoireSyncDB or {}
  local name,realm=safe(UnitFullName,"player"); if not name then name=safe(UnitName,"player") end
  realm=realm or safe(GetRealmName) or "Unknown"
  local class,classToken=safe(UnitClass,"player"); local race,raceToken=safe(UnitRace,"player")
  local zone=safe(GetRealZoneText) or safe(GetZoneText) or "Unknown"
  local build,buildNumber,_,interfaceVersion=safe(GetBuildInfo); local key=tostring(name or "Unknown").."-"..tostring(realm)
  GrimoireSyncDB.schema=5; GrimoireSyncDB.lastCharacter=key; GrimoireSyncDB.characters=GrimoireSyncDB.characters or {}
  GrimoireSyncDB.characters[key]={name=name or "Unknown",realm=realm,level=safe(UnitLevel,"player") or 0,class=class or "Unknown",classToken=classToken or "UNKNOWN",race=race or "Unknown",raceToken=raceToken or "UNKNOWN",faction=safe(UnitFactionGroup,"player") or "Unknown",zone=zone,gold=safe(GetMoney) or 0,client=build or "Unknown",build=buildNumber or "",interface=tonumber(interfaceVersion) or 0,timestamp=now()}
  captureInventory(); captureProfessions(); captureQuestFlags(); rebuildPayload()
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

for _,event in ipairs({"PLAYER_LOGIN","PLAYER_LEVEL_UP","ZONE_CHANGED_NEW_AREA","PLAYER_MONEY","BAG_UPDATE_DELAYED","PLAYER_LOGOUT","QUEST_TURNED_IN","QUEST_LOG_UPDATE","SKILL_LINES_CHANGED"}) do addon:RegisterEvent(event) end
addon:SetScript("OnEvent",function(_,event)
  if event=="BAG_UPDATE_DELAYED" and C_Timer and C_Timer.After then
    if pendingInventory then return end; pendingInventory=true
    C_Timer.After(0.5,function()pendingInventory=false;capture()end)
  else capture() end
end)
scan:RegisterEvent("REPLICATE_ITEM_LIST_UPDATE"); scan:RegisterEvent("AUCTION_ITEM_LIST_UPDATE")
scan:SetScript("OnEvent",function(_,event)if event=="REPLICATE_ITEM_LIST_UPDATE" then readReplicate() else readLegacy() end end)

SLASH_GRIMOIRESYNC1="/grimoire"
SlashCmdList.GRIMOIRESYNC=function(message)
  message=(message or ""):lower():match("^%s*(.-)%s*$")
  if message=="scan" then startAuctionScan(); return end
  capture()
  if message=="debug" then print("GrimoireSync schema="..tostring(GrimoireSyncDB.schema).." quetes="..tostring((function()local n=0 for _ in pairs(GrimoireSyncDB.completedTrackedQuests or {}) do n=n+1 end return n end)()).." API_QUETES="..tostring(GrimoireSyncDB.questAPI).." inventaire="..tostring(#(GrimoireSyncDB.inventory or {})).." API_AH="..tostring(C_AuctionHouse and C_AuctionHouse.ReplicateItems~=nil)); return end
  print("|cffd9b56cGrimoireSync|r : "..tostring(GrimoireSyncDB.lastCharacter)..", "..#(GrimoireSyncDB.inventory or {}).." piles dans les sacs.")
  print("|cffd9b56cGrimoireSync|r : ouvre l'hotel des ventes puis tape |cffffffff/grimoire scan|r. /reload enregistre les donnees.")
end

