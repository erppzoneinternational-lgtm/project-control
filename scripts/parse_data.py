import os
import re
import json
import uuid
import urllib.request

SUPABASE_URL = "https://dwpdrclupradpnsminvi.supabase.co"
# We will use direct SQL execution via postgres or Python request using service_role key or execute_sql via MCP tool.

# TSV raw text from user
RAW_TSV = """
2401	 soul Parcel 1&2 - الساحل - HAC	الساحل	Working	Emaar	Owner	Hesham El Seifi		Senior Project Manager	01202624321
2401	 soul Parcel 1&2 - الساحل - HAC	الساحل	Working	HAC	Main contractor	Evram Rafat		Project Manager	01143353755
2401	 soul Parcel 1&2 - الساحل - HAC	الساحل	Working	P.Zone	Sub- Contractor	Ahmed Wageh Abd El Alim	283	Civil project manger	
2401	 soul Parcel 1&2 - الساحل - HAC	الساحل	Working	P.Zone	Sub- Contractor	Bssam el bdry	79	Civil site eng.	
2401	 soul Parcel 1&2 - الساحل - HAC	الساحل	Working	P.Zone	Sub- Contractor	Khaled Ashraf Aly Khaled	96	Site Engeneer	
2401	 soul Parcel 1&2 - الساحل - HAC	الساحل	Working	P.Zone	Sub- Contractor	Ibrahim hasan abd El Alim sid	195	Civil site eng.	
2401	 soul Parcel 1&2 - الساحل - HAC	الساحل	Working	P.Zone	Sub- Contractor	Mustafa mohammed saad abo gali	245	Mechanical Eng.	
2401	 soul Parcel 1&2 - الساحل - HAC	الساحل	Working	P.Zone	Sub- Contractor	Omar Samy Abd El Hady Hlal	300	Civil Site Eng.	
2401	 soul Parcel 1&2 - الساحل - HAC	الساحل	Working	P.Zone	Sub- Contractor	Ahmed Yhia Ismail Abd Alhmid	340	Mechanical Eng.	
2401	 soul Parcel 1&2 - الساحل - HAC	الساحل	Working	P.Zone	Sub- Contractor	Ahmed Mohammed Mostafa Slim	348	Civil Site Eng.	
2401	 soul Parcel 1&2 - الساحل - HAC	الساحل	Working	P.Zone	Sub- Contractor	Karim mohamed Ali Mahmoud Mohamed	385	Mechanical Eng.	
2401	 soul Parcel 1&2 - الساحل - HAC	الساحل	Working	P.Zone	Sub- Contractor	Osama Mohammady Mohammed ELE.	387	Electrical Site Eng.	
2401	 soul Parcel 1&2 - الساحل - HAC	الساحل	Working	P.Zone	Sub- Contractor	Saoudi Mohamed Issa	391	Electrical Site Eng.	
2401	 soul Parcel 1&2 - الساحل - HAC	الساحل	Working	P.Zone	Sub- Contractor	Mohammed hassan abo al liel	178	Safety	
2401	 soul Parcel 1&2 - الساحل - HAC	الساحل	Working	P.Zone	Sub- Contractor	Adel Mohammed Sawy	286	Safety	
2401	 soul Parcel 1&2 - الساحل - HAC	الساحل	Working	P.Zone	Sub- Contractor	Karim Adel Adly	339	Safety	
2401	 soul Parcel 1&2 - الساحل - HAC	الساحل	Working	P.Zone	Sub- Contractor	Ahmed Mohammed El Sahaty	89	Surveyors	0109745550 P.zone 01120429166 
2401	 soul Parcel 1&2 - الساحل - HAC	الساحل	Working	P.Zone	Sub- Contractor	Ibrahim khaled abd el aty	181	Surveyors	01099697535 Per.
2401	 soul Parcel 1&2 - الساحل - HAC	الساحل	Working	P.Zone	Sub- Contractor	Fares Amer Ismael	145	 Surveyors	1080474433
2401	 soul Parcel 1&2 - الساحل - HAC	الساحل	Working	P.Zone	Sub- Contractor	Badr ayman mohammed al sid	174	Surveyors	01094053075 Per.
2401	 soul Parcel 1&2 - الساحل - HAC	الساحل	Working	P.Zone	Sub- Contractor	Ahmed Abd El Rahim	266	Surveyors	01016444221 P,zone
2401	 soul Parcel 1&2 - الساحل - HAC	الساحل	Working	P.Zone	Sub- Contractor	Abd el Rahman mostafa mohammed	361	Surveyors	01278556020 Per.
2401	 soul Parcel 1&2 - الساحل - HAC	الساحل	Working	P.Zone	Sub- Contractor	Hassan Atef Ahmd ali	388	Surveyors	01126550880 Per. 01066913009 
2401	 soul Parcel 1&2 - الساحل - HAC	الساحل	Working	P.Zone	Sub- Contractor	Zaki Gamal Zaki		Surveyors	
2401	 soul Parcel 1&2 - الساحل - HAC	الساحل	Working	P.Zone	Sub- Contractor	Abd el nabi Mehanni	59	Supervisor	01022180082 P.zone
2401	 soul Parcel 1&2 - الساحل - HAC	الساحل	Working	P.Zone	Sub- Contractor	Anwar Magdy Mahmoud Mohamed	325	Supervisor	01125486320 Per.
2401	 soul Parcel 1&2 - الساحل - HAC	الساحل	Working	P.Zone	Sub- Contractor	Mohammed Frg Abdelalim	146	Supervisor	01080474455P.zone / 01032775300
2401	 soul Parcel 1&2 - الساحل - HAC	الساحل	Working	P.Zone	Sub- Contractor	Mohamed Gmal Abd Alaziz Gafr	375	Supervisor	01029225419 Per.
2401	 soul Parcel 1&2 - الساحل - HAC	الساحل	Working	P.Zone	Sub- Contractor	Amer hany Amer	363	Supervisor	01205070268 Per.
2401	 soul Parcel 1&2 - الساحل - HAC	الساحل	Working	P.Zone	Sub- Contractor	Radwan Mohamed	251	DC	01158359385
2401	 soul Parcel 1&2 - الساحل - HAC	الساحل	Working	P.Zone	Sub- Contractor	Alaa Ali Mohamed Ali Almsry	295	أمين مخزن	01201550167
2401	 soul Parcel 1&2 - الساحل - HAC	الساحل	Working	P.Zone	Sub- Contractor	Omar Sabry Mostafa	347	محاسب	01070774713
2402	soul Parcel 3&4 - الساحل - Orascom	الساحل	Working	Orascom	Main Contractor	Mina George		Project Manager	01212111457
2402	soul Parcel 3&4 - الساحل - Orascom	الساحل	Working	P.Zone	Sub- Contractor	Ahmed Wageh Abd El Alim	283	Civil project manger	29810011700316
2402	soul Parcel 3&4 - الساحل - Orascom	الساحل	Working	P.Zone	Sub- Contractor	Bssam el bdry	79	Civil site eng.	29302140104774
2402	soul Parcel 3&4 - الساحل - Orascom	الساحل	Working	P.Zone	Sub- Contractor	Khaled Ashraf Aly Khaled	96	Site Engeneer	29704161600276
2402	soul Parcel 3&4 - الساحل - Orascom	الساحل	Working	P.Zone	Sub- Contractor	Ibrahim hasan abd El Alim sid	195	Civil site eng.	29811061402052
2402	soul Parcel 3&4 - الساحل - Orascom	الساحل	Working	P.Zone	Sub- Contractor	Mustafa mohammed saad abo gali	245	Mechanical Eng.	29809091500097
2402	soul Parcel 3&4 - الساحل - Orascom	الساحل	Working	P.Zone	Sub- Contractor	Omar Samy Abd El Hady Hlal	300	Civil Site Eng.	30212021700179
2402	soul Parcel 3&4 - الساحل - Orascom	الساحل	Working	P.Zone	Sub- Contractor	Ahmed Yhia Ismail Abd Alhmid	340	Mechanical Eng.	29105312100156
2402	soul Parcel 3&4 - الساحل - Orascom	الساحل	Working	P.Zone	Sub- Contractor	Ahmed Mohammed Mostafa Slim	348	Civil Site Eng.	29810280200914
2402	soul Parcel 3&4 - الساحل - Orascom	الساحل	Working	P.Zone	Sub- Contractor	Krim Mohamed Ali Mahmwd	385	Mechanical Eng.	30010068800412
2402	soul Parcel 3&4 - الساحل - Orascom	الساحل	Working	P.Zone	Sub- Contractor	Osama Mohammady Mohammed ELE.	387	Electrical Site Eng.	30112010106874
2402	soul Parcel 3&4 - الساحل - Orascom	الساحل	Working	P.Zone	Sub- Contractor	Saoudi Mohamed Issa	391	Electrical Site Eng.	29905112201337
2402	soul Parcel 3&4 - الساحل - Orascom	الساحل	Working	P.Zone	Sub- Contractor	Mohammed hassan abo al liel	178	Safety	29405201200911
2402	soul Parcel 3&4 - الساحل - Orascom	الساحل	Working	P.Zone	Sub- Contractor	Adel Mohammed Sawy	286	Safety	279010224033396
2402	soul Parcel 3&4 - الساحل - Orascom	الساحل	Working	P.Zone	Sub- Contractor	Karim Adel Adly	339	Safety	30011202404673
2402	soul Parcel 3&4 - الساحل - Orascom	الساحل	Working	P.Zone	Sub- Contractor	Ahmed Mohammed El Sahaty	89	Surveyors	0109745550 P.zone 01120429166 
2402	soul Parcel 3&4 - الساحل - Orascom	الساحل	Working	P.Zone	Sub- Contractor	Ibrahim khaled abd el aty	181	Surveyors	01099697535 Per.
2402	soul Parcel 3&4 - الساحل - Orascom	الساحل	Working	P.Zone	Sub- Contractor	Fares Amer Ismael	145	Surveyors	1080474433
2402	soul Parcel 3&4 - الساحل - Orascom	الساحل	Working	P.Zone	Sub- Contractor	Badr ayman mohammed al sid	174	Surveyors	01094053075 Per.
2402	soul Parcel 3&4 - الساحل - Orascom	الساحل	Working	P.Zone	Sub- Contractor	Ahmed Abd El Rahim	266	Surveyors	01016444221 P,zone
2402	soul Parcel 3&4 - الساحل - Orascom	الساحل	Working	P.Zone	Sub- Contractor	Abd el Rahman mostafa mohammed	361	Surveyors	01278556020 Per.
2402	soul Parcel 3&4 - الساحل - Orascom	الساحل	Working	P.Zone	Sub- Contractor	Hassan Atef Ahmd ali	388	Surveyors	01126550880 Per. 01066913009 
2402	soul Parcel 3&4 - الساحل - Orascom	الساحل	Working	P.Zone	Sub- Contractor	Zaki Gamal Zaki		Surveyors	
2402	soul Parcel 3&4 - الساحل - Orascom	الساحل	Working	P.Zone	Sub- Contractor	Abd el nabi Mehanni	59	Supervisor	01022180082 P.zone
2402	soul Parcel 3&4 - الساحل - Orascom	الساحل	Working	P.Zone	Sub- Contractor	Anwar Magdy Mahmoud Mohamed	325	Supervisor	01125486320 Per.
2402	soul Parcel 3&4 - الساحل - Orascom	الساحل	Working	P.Zone	Sub- Contractor	Mohammed Frg Abdelalim	146	Supervisor	01080474455P.zone / 01032775300
2402	soul Parcel 3&4 - الساحل - Orascom	الساحل	Working	P.Zone	Sub- Contractor	Mohamed Gmal Abd Alaziz Gafr	375	Supervisor	01029225419 Per.
2402	soul Parcel 3&4 - الساحل - Orascom	الساحل	Working	P.Zone	Sub- Contractor	Amer hany Amer	363	Supervisor	01205070268 Per.
2402	soul Parcel 3&4 - الساحل - Orascom	الساحل	Working	P.Zone	Sub- Contractor	Radwan Mohamed	251	DC	01158359385
2402	soul Parcel 3&4 - الساحل - Orascom	الساحل	Working	P.Zone	Sub- Contractor	Alaa Ali Mohamed Ali Almsry	295	أمين مخزن	01201550167
2402	soul Parcel 3&4 - الساحل - Orascom	الساحل	Working	P.Zone	Sub- Contractor	Omar Sabry Mostafa	347	محاسب	01070774713
2403	 soul Phase 1C - الساحل - Redcon	الساحل	Working	P.Zone	Sub- Contractor	Ahmed Wageh Abd El Alim	283	Civil project manger	29810011700316
2403	 soul Phase 1C - الساحل - Redcon	الساحل	Working	P.Zone	Sub- Contractor	Bssam El Bdry	174	Civil site eng.	29302140104774
2403	 soul Phase 1C - الساحل - Redcon	الساحل	Working	P.Zone	Sub- Contractor	Khaled Ashraf Aly Khaled	96	Site Engeneer	29704161600276
2403	 soul Phase 1C - الساحل - Redcon	الساحل	Working	P.Zone	Sub- Contractor	Ibrahim hasan abd El Alim sid	195	Civil site eng.	29811061402052
2403	 soul Phase 1C - الساحل - Redcon	الساحل	Working	Redcon	Main Contractor	Karim Said		Project Manager	01010012963
2403	 soul Phase 1C - الساحل - Redcon	الساحل	Working	P.Zone	Sub- Contractor	Mustafa mohammed saad abo gali	245	Mechanical Eng.	29809091500097
2403	 soul Phase 1C - الساحل - Redcon	الساحل	Working	P.Zone	Sub- Contractor	Omar Samy Abd El Hady Hlal	300	Civil Site Eng.	30212021700179
2403	 soul Phase 1C - الساحل - Redcon	الساحل	Working	P.Zone	Sub- Contractor	Ahmed Yhia Ismail Abd Alhmid	340	Mechanical Eng.	29105312100156
2403	 soul Phase 1C - الساحل - Redcon	الساحل	Working	P.Zone	Sub- Contractor	Ahmed Mohammed Mostafa Slim	348	Civil Site Eng.	29810280200914
2403	 soul Phase 1C - الساحل - Redcon	الساحل	Working	P.Zone	Sub- Contractor	Krim Mohamed Ali Mahmwd	385	Mechanical Eng.	30010068800412
2403	 soul Phase 1C - الساحل - Redcon	الساحل	Working	P.Zone	Sub- Contractor	Osama Mohammady Mohammed	387	Electrical Site Eng.	30112010106874
2403	 soul Phase 1C - الساحل - Redcon	الساحل	Working	P.Zone	Sub- Contractor	Saoudi Mohamed Issa	391	Electrical Site Eng.	29905112201337
2403	 soul Phase 1C - الساحل - Redcon	الساحل	Working	P.Zone	Sub- Contractor	Mohammed hassan abo al liel	178	Safety	29405201200911
2403	 soul Phase 1C - الساحل - Redcon	الساحل	Working	P.Zone	Sub- Contractor	Adel Mohammed Sawy	286	Safety	279010224033396
2403	 soul Phase 1C - الساحل - Redcon	الساحل	Working	P.Zone	Sub- Contractor	Karim Adel Adly	339	Safety	30011202404673
2403	 soul Phase 1C - الساحل - Redcon	الساحل	Working	P.Zone	Sub- Contractor	Ahmed Mohammed El Sahaty	89	Surveyors	0109745550 P.zone 01120429166 
2403	 soul Phase 1C - الساحل - Redcon	الساحل	Working	P.Zone	Sub- Contractor	Ibrahim khaled abd el aty	181	Surveyors	01099697535 Per.
2403	 soul Phase 1C - الساحل - Redcon	الساحل	Working	P.Zone	Sub- Contractor	Fares Amer Ismael	145	Surveyors	1080474433
2403	 soul Phase 1C - الساحل - Redcon	الساحل	Working	P.Zone	Sub- Contractor	Badr ayman mohammed al sid	174	Surveyors	01094053075 Per.
2403	 soul Phase 1C - الساحل - Redcon	الساحل	Working	P.Zone	Sub- Contractor	Ahmed Abd El Rahim	266	Surveyors	01016444221 P,zone
2403	 soul Phase 1C - الساحل - Redcon	الساحل	Working	P.Zone	Sub- Contractor	Abd el Rahman mostafa mohammed	361	Surveyors	01278556020 Per.
2403	 soul Phase 1C - الساحل - Redcon	الساحل	Working	P.Zone	Sub- Contractor	Hassan Atef Ahmd ali	388	Surveyors	01126550880 Per. 01066913009 
2403	 soul Phase 1C - الساحل - Redcon	الساحل	Working	P.Zone	Sub- Contractor	Zaki Gamal Zaki		Surveyors	
2403	 soul Phase 1C - الساحل - Redcon	الساحل	Working	P.Zone	Sub- Contractor	Abd el nabi Mehanni	59	Supervisor	01022180082 P.zone
2403	 soul Phase 1C - الساحل - Redcon	الساحل	Working	P.Zone	Sub- Contractor	Anwar Magdy Mahmoud Mohamed	325	Supervisor	01125486320 Per.
2403	 soul Phase 1C - الساحل - Redcon	الساحل	Working	P.Zone	Sub- Contractor	Mohammed Frg Abdelalim	146	Supervisor	01080474455P.zone / 01032775300
2403	 soul Phase 1C - الساحل - Redcon	الساحل	Working	P.Zone	Sub- Contractor	Mohamed Gmal Abd Alaziz Gafr	375	Supervisor	01029225419 Per.
2403	 soul Phase 1C - الساحل - Redcon	الساحل	Working	P.Zone	Sub- Contractor	Amer hany Amer	363	Supervisor	01205070268 Per.
2403	 soul Phase 1C - الساحل - Redcon	الساحل	Working	P.Zone	Sub- Contractor	Radwan Mohamed	251	DC	01158359385
2403	 soul Phase 1C - الساحل - Redcon	الساحل	Working	P.Zone	Sub- Contractor	Alaa Ali Mohamed Ali Almsry	295	أمين مخزن	01201550167
2403	 soul Phase 1C - الساحل - Redcon	الساحل	Working	P.Zone	Sub- Contractor	Omar Sabry Mostafa	347	محاسب	01070774713
2511	رأس الحكمة -MODON عدد 6 حمام سباحة و 2 نافورة - Orascom - الساحل 	الساحل	Working	MODON	Owner	NA			
2511	رأس الحكمة -MODON عدد 6 حمام سباحة و 2 نافورة - Orascom - الساحل 	الساحل	Working	Orascom	Main Contractor	Abdel Menem Yassine		Project Manager	01270350961
2511	رأس الحكمة -MODON عدد 6 حمام سباحة و 2 نافورة - Orascom - الساحل 	الساحل	Working	P.Zone	Sub- Contractor	Ahmed Maher Fahmy	288	Civil Site Eng.	01273890528
2511	رأس الحكمة -MODON عدد 6 حمام سباحة و 2 نافورة - Orascom - الساحل 	الساحل	Working	P.Zone	Sub- Contractor	Alaa el Hennawy	248	Civil Site Eng.	01005277360
2511	رأس الحكمة -MODON عدد 6 حمام سباحة و 2 نافورة - Orascom - الساحل 	الساحل	Working	P.Zone	Sub- Contractor	Mohamed Atef Mohamed Zidan		Civil Site Eng.	01044992845
2511	رأس الحكمة -MODON عدد 6 حمام سباحة و 2 نافورة - Orascom - الساحل 	الساحل	Working	P.Zone	Sub- Contractor	إبراهيم عطا إبراهيم خليل		Hotel Security	
2511	رأس الحكمة -MODON عدد 6 حمام سباحة و 2 نافورة - Orascom - الساحل 	الساحل	Working	P.Zone	Sub- Contractor	أحمد حمام كامل الأمير		Hotel Store Keeper	
2511	رأس الحكمة -MODON عدد 6 حمام سباحة و 2 نافورة - Orascom - الساحل 	الساحل	Working	P.Zone	Sub- Contractor	Mohammed Mamdouh Hassan Ali	346	Supervisor	
2511	رأس الحكمة -MODON عدد 6 حمام سباحة و 2 نافورة - Orascom - الساحل 	الساحل	Working	P.Zone	Sub- Contractor	Mohammed Abd El Razek Fahmy الشباسي	287	Supervisor	01067080305
2511	رأس الحكمة -MODON عدد 6 حمام سباحة و 2 نافورة - Orascom - الساحل 	الساحل	Working	P.Zone	Sub- Contractor	Galal Abd El Aty Sadek	324	Supervisor	
2405	رملة - حمام سباحة (Lobby) - مراكز العقارية - الساحل - 	الساحل	Working	Marakez	Owner	Omar Magdi		Construction Manager	01002911856
2405	رملة - حمام سباحة (Lobby) - مراكز العقارية - الساحل - 	الساحل	Working	P.Zone	Main Contractor	Ahmed Mohammed Shehata abd alglil	91	Site Engeneer	01022855665
2405	رملة - حمام سباحة (Lobby) - مراكز العقارية - الساحل - 	الساحل	Working	P.Zone	Main Contractor	Mostafa Amir Ahmed	151	Site Engeneer	01050390804
2405	رملة - حمام سباحة (Lobby) - مراكز العقارية - الساحل - 	الساحل	Working	P.Zone	Main Contractor	Mahmoud Khaled Ahmed	331	Civil Site Eng.	01117027500
2405	رملة - حمام سباحة (Lobby) - مراكز العقارية - الساحل - 	الساحل	Working	P.Zone	Main Contractor	Mohamed Mohsn Barkat Moamed	373	Electrical Site Eng.	01144775783 -  01032985553 
2405	رملة - حمام سباحة (Lobby) - مراكز العقارية - الساحل - 	الساحل	Working	P.Zone	Main Contractor	Mohammed ali hasan Ibrahim El lbani	212	Safety	01022354004
2405	رملة - حمام سباحة (Lobby) - مراكز العقارية - الساحل - 	الساحل	Working	P.Zone	Main Contractor	Ali Ayman Ali	210	         Surveyors	01003447406
2405	رملة - حمام سباحة (Lobby) - مراكز العقارية - الساحل - 	الساحل	Working	P.Zone	Main Contractor	Mohamed Nasser Mahmoud	294	DC	01208523873
2405	رملة - حمام سباحة (Lobby) - مراكز العقارية - الساحل - 	الساحل	Working	P.Zone	Main Contractor	حامد السيد إبراهيم الخواجة		Store Keeper	
2405	رملة - حمام سباحة (Lobby) - مراكز العقارية - الساحل - 	الساحل	Working	P.Zone	Main Contractor	رجب عبد البديع		Supervisor	0128296
2405	رملة - حمام سباحة (Lobby) - مراكز العقارية - الساحل - 	الساحل	Working	P.Zone	Main Contractor	Ahmed Rateb Mahmoud	284	Accountant	01149242525
2419	رملة - 41 حمام سباحة - مراكز العقارية - الساحل - 	الساحل	Working	P.Zone	Main Contractor	Ahmed Mohammed Shehata abd alglil	91	Site Engeneer	01022855665
2419	رملة - 41 حمام سباحة - مراكز العقارية - الساحل - 	الساحل	Working	P.Zone	Main Contractor	Mostafa Amir Ahmed	151	Site Engeneer	01050390804
2419	رملة - 41 حمام سباحة - مراكز العقارية - الساحل - 	الساحل	Working	P.Zone	Main Contractor	Mahmoud Khaled Ahmed	331	Civil Site Eng.	01117027500
2419	رملة - 41 حمام سباحة - مراكز العقارية - الساحل - 	الساحل	Working	P.Zone	Main Contractor	Mohamed Mohsn Barkat Moamed	373	Electrical Site Eng.	01144775783 -  01032985553 
2419	رملة - 41 حمام سباحة - مراكز العقارية - الساحل - 	الساحل	Working	P.Zone	Main Contractor	Mohammed ali hasan Ibrahim El lbani	212	Safety	01022354004
2419	رملة - 41 حمام سباحة - مراكز العقارية - الساحل - 	الساحل	Working	P.Zone	Main Contractor	Ali Ayman Ali	210	         Surveyors	01003447406
2419	رملة - 41 حمام سباحة - مراكز العقارية - الساحل - 	الساحل	Working	P.Zone	Main Contractor	Mohamed Nasser Mahmoud	294	DC	01208523873
2419	رملة - 41 حمام سباحة - مراكز العقارية - الساحل - 	الساحل	Working	P.Zone	Main Contractor	حامد السيد إبراهيم الخواجة		Store Keeper	
2419	رملة - 41 حمام سباحة - مراكز العقارية - الساحل - 	الساحل	Working	P.Zone	Main Contractor	رجب عبد البديع		Supervisor	01282963221
2419	رملة - 41 حمام سباحة - مراكز العقارية - الساحل - 	الساحل	Working	P.Zone	Main Contractor	Ahmed Rateb Mahmoud	284	Accountant	01149242525
2604	SLX - عدد (2) بحيرات - حسن علام HAP - الساحل - 	الساحل	Working	HAP	Main Contractor	Tarek Shawkat		Project Manager	01005759415
2604	SLX - عدد (2) بحيرات - حسن علام HAP - الساحل - 	الساحل	Working	P.Zone	Sub- Contractor	Osama ShahIn	41	Civil Site Eng.	01201605952
2604	SLX - عدد (2) بحيرات - حسن علام HAP - الساحل - 	الساحل	Working	P.Zone	Sub- Contractor	Mhmwd Mohamed Abd Altif Mohamed	398	Civil Site Eng.	01110562135- 01034349407
2604	SLX - عدد (2) بحيرات - حسن علام HAP - الساحل - 	الساحل	Working	P.Zone	Sub- Contractor	Akram Mohammed Abd Al-Alim	384	civil site Eng	01110771473
2604	SLX - عدد (2) بحيرات - حسن علام HAP - الساحل - 	الساحل	Working	P.Zone	Sub- Contractor	Mahmoud Mostafa Abd al kader	383	Planning Eng ( civil )	01022013110
2604	SLX - عدد (2) بحيرات - حسن علام HAP - الساحل - 	الساحل	Working	P.Zone	Sub- Contractor	Ahmed Kamel Abd El Razek	341	Safety	01025604031
2604	SLX - عدد (2) بحيرات - حسن علام HAP - الساحل - 	الساحل	Working	P.Zone	Sub- Contractor	Mostafa Ali Ahmed Rabee'	315	Accountant	01064935493
2604	SLX - عدد (2) بحيرات - حسن علام HAP - الساحل - 	الساحل	Working	P.Zone	Sub- Contractor	Amr Ahmed gouda Mhmwd Aldwi	267	  Surveyors	01206172633-01070274713
2604	SLX - عدد (2) بحيرات - حسن علام HAP - الساحل - 	الساحل	Working	P.Zone	Sub- Contractor	Basem Abd Al Daim Mohamed		Surveyors	01026053559
2604	SLX - عدد (2) بحيرات - حسن علام HAP - الساحل - 	الساحل	Working	P.Zone	Sub- Contractor	Eslam Said Abd Alrazek Mostfa		Surveyors	01276397335
2604	SLX - عدد (2) بحيرات - حسن علام HAP - الساحل - 	الساحل	Working	P.Zone	Sub- Contractor	Mohamed Al Sid Ahmed Al Sid		DC	
2604	SLX - عدد (2) بحيرات - حسن علام HAP - الساحل - 	الساحل	Working	P.Zone	Sub- Contractor	Abdulkhaliq Gharib Abdulkhaliq Muhammad	333	Supervisor	01208422133
2604	SLX - عدد (2) بحيرات - حسن علام HAP - الساحل - 	الساحل	Working	P.Zone	Sub- Contractor	Ahmed Shaaban Ahmed Morsy	230	Supervisor	01032977761
2604	SLX - عدد (2) بحيرات - حسن علام HAP - الساحل - 	الساحل	Working	P.Zone	Sub- Contractor	أحمد أشرف محمد فرج جاد		Store Keeper	
2604	SLX - عدد (2) بحيرات - حسن علام HAP - الساحل - 	الساحل	Working	P.Zone	Sub- Contractor	محمود عادل		Store Keeper	
2421	 Extension- R8 - حمام سباحة 20 - HAC - الساحل -  مراسي	الساحل	Handing Over	HAC	Main Contractor	Ahmed Youssef		Project Manager	01033047468
2421	 Extension- R8 - حمام سباحة 20 - HAC - الساحل -  مراسي	الساحل	Handing Over	P.Zone	Sub- Contractor	Osama ShahIn	41	Civil Site Eng.	01201605952
2421	 Extension- R8 - حمام سباحة 20 - HAC - الساحل -  مراسي	الساحل	Handing Over	P.Zone	Sub- Contractor	Sherif Sayed	241	Architecture Site Eng.	01111207674/ 01020033837
2421	 Extension- R8 - حمام سباحة 20 - HAC - الساحل -  مراسي	الساحل	Handing Over	P.Zone	Sub- Contractor	Nabil Abd El Aal		Supervisor	01061982559
2421	 Extension- R8 - حمام سباحة 20 - HAC - الساحل -  مراسي	الساحل	Handing Over	P.Zone	Sub- Contractor	EL Sayed Amer	231	Store Keeper	01005869696
2404	Zoya - Phase 02 - شركة لاند مارك	الساحل	Working	LMD	Owner	Tamer Safwat		Projects Director	01067790915
2404	Zoya - Phase 02 - شركة لاند مارك	الساحل	Working	P.Zone	Main Contractor	Osama ShahIn	41	Civil Site Eng.	01201605952
2404	Zoya - Phase 02 - شركة لاند مارك	الساحل	Working	P.Zone	Main Contractor	Wael said mahmoud Daha	122	Site Engeneer	01099500362
2404	Zoya - Phase 02 - شركة لاند مارك	الساحل	Working	P.Zone	Main Contractor	Abd El Rahman Saad	213	Mech Eng	01032977701
2404	Zoya - Phase 02 - شركة لاند مارك	الساحل	Working	P.Zone	Main Contractor	Omar Nabil Abd El Aal	335	Supervisor	01080746466
2404	Zoya - Phase 02 - شركة لاند مارك	الساحل	Working	P.Zone	Main Contractor	EL Sayed Amer	231	Store Keeper	01005869696
2404	Zoya - Phase 02 - شركة لاند مارك	الساحل	Working	P.Zone	Main Contractor	Ahmed Ashraf Al-Tigani		Store Keeper	
2512	Zoya - Phase 02 - شركة لاند مارك	الساحل	Working	P.Zone	Main Contractor	Osama ShahIn	41	Civil Site Eng.	01201605952
2412	سيلفر ساند - 8 حمامات سباحة - اوراسكوم - الساحل	الساحل	Working	Orascom	Main Contractor	Abdel Menem Yassine		Project Manager	01270350961
2412	سيلفر ساند - 8 حمامات سباحة - اوراسكوم - الساحل	الساحل	Handing Over	P.Zone	Sub- Contractor	Mina Nabil	247	Civil Site Eng.	01066031006
2412	سيلفر ساند - 8 حمامات سباحة - اوراسكوم - الساحل	الساحل	Handing Over	P.Zone	Sub- Contractor	Mohammed Gamal Zaki	293	Surveyor	01099144418
2412	سيلفر ساند - 8 حمامات سباحة - اوراسكوم - الساحل	الساحل	Handing Over	P.Zone	Sub- Contractor	Mohamed Nasef Roshdy		Store Keeper	01034349329
2308	 حمامات سباحة الابراج الصينية - الشركة الصينية CSCEC	الساحل	Working	CSCEC	Main Contractor	Zaho		MEP Manager	01101596102
2308	 حمامات سباحة الابراج الصينية - الشركة الصينية CSCEC	الساحل	Working	P.Zone	Sub- Contractor	Ibrahim Gomaa Ibrahim Abd Alrhman	152	Site Engeneer	01027366286
2308	 حمامات سباحة الابراج الصينية - الشركة الصينية CSCEC	الساحل	Working	P.Zone	Sub- Contractor	Mokhtar Qodb Krim Gmaa	217	Supervisor	01069839653
2308	 حمامات سباحة الابراج الصينية - الشركة الصينية CSCEC	الساحل	Working	P.Zone	Sub- Contractor	Ali Khalifa Nazeef	249	Supervisor	01060289473
2308	 حمامات سباحة الابراج الصينية - الشركة الصينية CSCEC	الساحل	Working	CSCEC	Main Contractor	Zaho		MEP Manager	01101596102
2308	 حمامات سباحة الابراج الصينية - الشركة الصينية CSCEC	الساحل	Working	P.Zone	Main Contractor	Ibrahim Gomaa Ibrahim Abd Alrhman	152	Site Engeneer	01027366286
2308	 حمامات سباحة الابراج الصينية - الشركة الصينية CSCEC	الساحل	Working	P.Zone	Main Contractor	Mokhtar Qodb Krim Gmaa	217	Supervisor	01069839653
2308	 حمامات سباحة الابراج الصينية - الشركة الصينية CSCEC	الساحل	Working	P.Zone	Main Contractor	Ali Khalifa Nazeef	249	Supervisor	01060289473
2606	Ezz Pools Belle Ville - October	Cairo	Working	P.Zone	Main Contractor	Nagy Neseim	224	Project Manager	
2606	Ezz Pools Belle Ville - October	Cairo	Working	P.Zone	Main Contractor	Ahmed Emad		Senior Surveyor	
2606	Ezz Pools Belle Ville - October	Cairo	Working	P.Zone	Main Contractor	Pola Morris	226	Mechanical Section Head	
2602	The Crown Palm Hills Villa 3010 A & B - October	Cairo	Working	P.Zone	Main Contractor	Mostafa Adel	55	Project Manager	
2602	The Crown Palm Hills Villa 3010 A & B - October	Cairo	Working	P.Zone	Main Contractor	Shady El-Kordy		Construction Manager	
2602	The Crown Palm Hills Villa 3010 A & B - October	Cairo	Working	P.Zone	Main Contractor	El-Sayed Mohamed Ali	109	Supervisor	
2602	The Crown Palm Hills Villa 3010 A & B - October	Cairo	Working	P.Zone	Main Contractor	Mohamed Alaa		Supervisor	
2602	The Crown Palm Hills Villa 3010 A & B - October	Cairo	Working	P.Zone	Main Contractor	Pola Morris	226	Mechanical Section Head	
2603	Dina Rafaat - Palm Hills - October	Cairo	Working	P.Zone	Main Contractor	Mostafa Adel	55	Project Manager	
2603	Dina Rafaat - Palm Hills - October	Cairo	Working	P.Zone	Main Contractor	Shady El-Kordy		Construction Manager	
2603	Dina Rafaat - Palm Hills - October	Cairo	Working	P.Zone	Main Contractor	El-Sayed Mohamed Ali	109	Supervisor	
2603	Dina Rafaat - Palm Hills - October	Cairo	Working	P.Zone	Main Contractor	Mohamed Alaa	135	Supervisor	
2603	Dina Rafaat - Palm Hills - October	Cairo	Working	P.Zone	Main Contractor	Pola Morris	226	Mechanical Section Head	
2272	Water Way 6A-Fountain & Swimming Pools- New Cairo	Cairo	Working	P.Zone	Main Contractor	Mohamed Shaaban	90	Project Manager	
2272	Water Way 6A-Fountain & Swimming Pools- New Cairo	Cairo	Working	P.Zone	Main Contractor	Abdel Rahman Azab	25	Construction Manager	
2272	Water Way 6A-Fountain & Swimming Pools- New Cairo	Cairo	Working	P.Zone	Main Contractor	Abdel Razek Mohamed	108	Supervisor	
2272	Water Way 6A-Fountain & Swimming Pools- New Cairo	Cairo	Working	P.Zone	Main Contractor	Ali Khalifa Nazeef	249	Supervisor	
2272	Water Way 6A-Fountain & Swimming Pools- New Cairo	Cairo	Working	P.Zone	Main Contractor	Naser Gomaa		Supervisor	
2272	Water Way 6A-Fountain & Swimming Pools- New Cairo	Cairo	Working	P.Zone	Main Contractor	Kamal Abdel Hameed		Supervisor	
2272	Water Way 6A-Fountain & Swimming Pools- New Cairo	Cairo	Working	P.Zone	Main Contractor	Pola Morris	226	Mechanical Section Head	
NA	Concord City Gate - 3 Fountains - New Cairo	Cairo	Working	P.Zone	Sub- Contractor	Mohamed Shaaban	90	Project Manager	
NA	Concord City Gate - 3 Fountains - New Cairo	Cairo	Working	P.Zone	Sub- Contractor	Abdel Rahman Azab	25	Construction Manager	
NA	Concord City Gate - 3 Fountains - New Cairo	Cairo	Working	P.Zone	Sub- Contractor	Abdel Razek Mohamed	108	Supervisor	
NA	Concord City Gate - 3 Fountains - New Cairo	Cairo	Working	P.Zone	Sub- Contractor	Ali Khalifa Nazeef	249	Supervisor	
NA	Concord City Gate - 3 Fountains - New Cairo	Cairo	Working	P.Zone	Sub- Contractor	Naser Gomaa		Supervisor	
NA	Concord City Gate - 3 Fountains - New Cairo	Cairo	Working	P.Zone	Sub- Contractor	Kamal Abdel Hameed		Supervisor	
NA	Concord City Gate - 3 Fountains - New Cairo	Cairo	Working	P.Zone	Sub- Contractor	Pola Morris	226	Mechanical Section Head	
2601	District 5- Parcel N - Marakez - New Cairo 	Cairo	Working	P.Zone	Main Contractor	Mohamed Shaaban	90	Project Manager	
2601	District 5- Parcel N - Marakez - New Cairo 	Cairo	Working	P.Zone	Main Contractor	Abdel Rahman Azab	25	Construction Manager	
2601	District 5- Parcel N - Marakez - New Cairo 	Cairo	Working	P.Zone	Main Contractor	Abdel Razek Mohamed	108	Supervisor	
2601	District 5- Parcel N - Marakez - New Cairo 	Cairo	Working	P.Zone	Main Contractor	Ali Khalifa Nazeef	249	Supervisor	
2601	District 5- Parcel N - Marakez - New Cairo 	Cairo	Working	P.Zone	Main Contractor	Naser Gomaa		Supervisor	
2601	District 5- Parcel N - Marakez - New Cairo 	Cairo	Working	P.Zone	Main Contractor	Kamal Abdel Hameed		Supervisor	
2601	District 5- Parcel N - Marakez - New Cairo 	Cairo	Working	P.Zone	Main Contractor	Pola Morris	226	Mechanical Section Head	
2308	Crescent Tower - الأبراج الصينية - CSCEC - New Capital	Cairo	Working	CSCEC	Main Contractor	Zaho		MEP Manager	01101596102
2308	Crescent Tower - الأبراج الصينية - CSCEC - New Capital	Cairo	Working	P.Zone	Sub- Contractor	Ibrahim Gomaa	152	Project Manager	
2308	Crescent Tower - الأبراج الصينية - CSCEC - New Capital	Cairo	Working	P.Zone	Sub- Contractor	Ali Khalifa Nazeef	249	Supervisor	
2308	Crescent Tower - الأبراج الصينية - CSCEC - New Capital	Cairo	Working	P.Zone	Sub- Contractor	Mokhtar Kotb	217	Supervisor	
2308	Crescent Tower - الأبراج الصينية - CSCEC - New Capital	Cairo	Working	P.Zone	Sub- Contractor	Mohamed El-Bakry	344	Supervisor	
2308	Crescent Tower - الأبراج الصينية - CSCEC - New Capital	Cairo	Working	P.Zone	Sub- Contractor	Pola Morris	226	Mechanical Section Head	
2414	I-City - Curve - New Capital	Cairo	Working	Curve - DMC	Main Contractor	Eng. Tamer		Project Manager	01018222731
2414	I-City - Curve - New Capital	Cairo	Working	P.Zone	Sub- Contractor	Ibrahim Gomaa	152	Project Manager	
2414	I-City - Curve - New Capital	Cairo	Working	P.Zone	Sub- Contractor	Ali Khalifa Nazeef	249	Supervisor	
2414	I-City - Curve - New Capital	Cairo	Working	P.Zone	Sub- Contractor	Mokhtar Kotb	217	Supervisor	
2414	I-City - Curve - New Capital	Cairo	Working	P.Zone	Sub- Contractor	Mohamed El-Bakry	344	Supervisor	
2414	I-City - Curve - New Capital	Cairo	Working	P.Zone	Sub- Contractor	Pola Morris	226	Mechanical Section Head	
2333	Mansoura 7 - Inspire - New Capital	Cairo	Working	Inspire	Main- Contractor				
2333	Mansoura 7 - Inspire - New Capital	Cairo	Working	P.Zone	Sub- Contractor	Ibrahim Gomaa	152	Project Manager	
2333	Mansoura 7 - Inspire - New Capital	Cairo	Working	P.Zone	Sub- Contractor	Ali Khalifa Nazeef	249	Supervisor	
2333	Mansoura 7 - Inspire - New Capital	Cairo	Working	P.Zone	Sub- Contractor	Mokhtar Kotb	217	Supervisor	
2333	Mansoura 7 - Inspire - New Capital	Cairo	Working	P.Zone	Sub- Contractor	Mohamed El-Bakry	344	Supervisor	
2333	Mansoura 7 - Inspire - New Capital	Cairo	Working	P.Zone	Sub- Contractor	Pola Morris	226	Mechanical Section Head	
2269	Capital Way - Time Mix - New Capital	Cairo	Working	Time Mix-Water Way	Main Contractor	Mohamed Hosny		Technical Office Manager	01111971665
2269	Capital Way - Time Mix - New Capital	Cairo	Working	P.Zone	Sub- Contractor	Ibrahim Gomaa	152	Project Manager	
2269	Capital Way - Time Mix - New Capital	Cairo	Working	P.Zone	Sub- Contractor	Ali Khalifa Nazeef	249	Supervisor	
2269	Capital Way - Time Mix - New Capital	Cairo	Working	P.Zone	Sub- Contractor	Mokhtar Kotb	217	Supervisor	
2269	Capital Way - Time Mix - New Capital	Cairo	Working	P.Zone	Sub- Contractor	Mohamed El-Bakry	344	Supervisor	
2269	Capital Way - Time Mix - New Capital	Cairo	Working	P.Zone	Sub- Contractor	Pola Morris	226	Mechanical Section Head	
1044	استشارات درة الكرز 2 - المصممون للهندسة -1044	Cairo	Maintenance 	الهيئة الهندسية للقوات المسلحة	Owner 	العميد جمال سالم			
1044	استشارات درة الكرز 2 - المصممون للهندسة -1044	Cairo	Maintenance 	P.Zone	Main contractor	Mostafa Omar	19	Project Manager	
1044	استشارات درة الكرز 2 - المصممون للهندسة -1044	Cairo	Maintenance 	P.Zone	Main contractor	Mawhoub Mahmoud Ahmed	67	Supervisor 	01066220985
1044	استشارات درة الكرز 2 - المصممون للهندسة -1044	Cairo	Maintenance 	P.Zone	Main contractor	Salah Azzazi Abd el fattah	13	Supervisor 	01022842289
2105	21-05 - درة الكرز 1 - شركة الفيداوي	Cairo	Maintenance 	P.Zone	Main contractor	Mawhoub Mahmoud Ahmed	67	Supervisor 	01066220985
2105	21-05 - درة الكرز 1 - شركة الفيداوي	Cairo	Maintenance 	P.Zone	Main contractor	Salah Azzazi Abd el fattah	13	Supervisor 	01022842289
2106	21-33 - درة الكرز ميني كومباوند -شركة اوراسكوم ثم شركة شلبي	Cairo	Handing Over	P.Zone	Main contractor	Mawhoub Mahmoud Ahmed	67	Supervisor 	01066220985
2106	21-33 - درة الكرز ميني كومباوند -شركة اوراسكوم ثم شركة شلبي	Cairo	Handing Over	P.Zone	Main contractor	Salah Azzazi Abd el fattah	13	Supervisor 	01022842289
2605	"Four Seasonsn Hotel - Luxor
6 Swimming pool- 4 Fountains - 
12 منشأ مائي + خرسانة وميكانيكا"	Luxor	Working	P.Zone	Sub- Contractor	Mina Samir	184	Project Manager	0 1099858552
2605	"Four Seasonsn Hotel - Luxor
6 Swimming pool- 4 Fountains - 
12 منشأ مائي + خرسانة وميكانيكا"	Luxor	Working	P.Zone	Sub- Contractor	Mohammed Hamdi Fathi	138	Site Engeneer	01070474455
2605	"Four Seasonsn Hotel - Luxor
6 Swimming pool- 4 Fountains - 
12 منشأ مائي + خرسانة وميكانيكا"	Luxor	Working	P.Zone	Sub- Contractor	Mostafa Omar	19	"Projects Coordintor &
 Cost Control Manager"	1022844113
2605	"Four Seasonsn Hotel - Luxor
6 Swimming pool- 4 Fountains - 
12 منشأ مائي + خرسانة وميكانيكا"	Luxor	Working	P.Zone	Sub- Contractor	Ahmed Abd Altif Mahmoud Alminiawi	400/1000	Site Engeneer	01090177295-01044992840
2605	"Four Seasonsn Hotel - Luxor
6 Swimming pool- 4 Fountains - 
12 منشأ مائي + خرسانة وميكانيكا"	Luxor	Working	P.Zone	Sub- Contractor	Aya Sayed	57	Technical Office Manager	1066220357
2605	"Four Seasonsn Hotel - Luxor
6 Swimming pool- 4 Fountains - 
12 منشأ مائي + خرسانة وميكانيكا"	Luxor	Working	P.Zone	Sub- Contractor	Nirmen Gamal	329	Planning Section Head	1021111762
2605	"Four Seasonsn Hotel - Luxor
6 Swimming pool- 4 Fountains - 
12 منشأ مائي + خرسانة وميكانيكا"	Luxor	Working	P.Zone	Sub- Contractor	Pola Morris	226	Mechanical Section Head	0 10 69826535
2605	"Four Seasonsn Hotel - Luxor
6 Swimming pool- 4 Fountains - 
12 منشأ مائي + خرسانة وميكانيكا"	Luxor	Working	P.Zone	Sub- Contractor	Abdel Rahman Azab	25	Electrical Section Head	0 1050222189
2605	"Four Seasonsn Hotel - Luxor
6 Swimming pool- 4 Fountains - 
12 منشأ مائي + خرسانة وميكانيكا"	Luxor	Working	P.Zone	Sub- Contractor	Amir Mostafa	56	Team Leader DC	1066220351
2605	"Four Seasonsn Hotel - Luxor
6 Swimming pool- 4 Fountains - 
12 منشأ مائي + خرسانة وميكانيكا"	Luxor	Working	P.Zone	Sub- Contractor	Mohamed Fatouh	205	Senior Document Control	0 1025485140
2605	"Four Seasonsn Hotel - Luxor
6 Swimming pool- 4 Fountains - 
12 منشأ مائي + خرسانة وميكانيكا"	Luxor	Working	P.Zone	Sub- Contractor	Amr Rady	179	Senior Civil Technical Office	0 1020100511
2605	"Four Seasonsn Hotel - Luxor
6 Swimming pool- 4 Fountains - 
12 منشأ مائي + خرسانة وميكانيكا"	Luxor	Working	P.Zone	Sub- Contractor	Mohamed Hussien	229	Civil Technical Office	0 1012342472
2605	"Four Seasonsn Hotel - Luxor
6 Swimming pool- 4 Fountains - 
12 منشأ مائي + خرسانة وميكانيكا"	Luxor	Working	P.Zone	Sub- Contractor	Mahasen Eid	93	Senior Technical Office	0 1080015702
2605	"Four Seasonsn Hotel - Luxor
6 Swimming pool- 4 Fountains - 
12 منشأ مائي + خرسانة وميكانيكا"	Luxor	Working	P.Zone	Sub- Contractor	Asmaa ABD El Menem	94	Electrical Technical Office	0 10 64666801
2605	"Four Seasonsn Hotel - Luxor
6 Swimming pool- 4 Fountains - 
12 منشأ مائي + خرسانة وميكانيكا"	Luxor	Working	P.Zone	Sub- Contractor	Mohamed Magdy	358	Electrical Technical Office	0 10 80015694
2605	"Four Seasonsn Hotel - Luxor
6 Swimming pool- 4 Fountains - 
12 منشأ مائي + خرسانة وميكانيكا"	Luxor	Working	P.Zone	Sub- Contractor	Ashraf Ibrahima	302	Mechanical Technical Office	0 10 50434497
2605	"Four Seasonsn Hotel - Luxor
6 Swimming pool- 4 Fountains - 
12 منشأ مائي + خرسانة وميكانيكا"	Luxor	Working	P.Zone	Sub- Contractor	Abdallah Gamal	299	Mechanical Technical Office	0 10 32980999
2605	"Four Seasonsn Hotel - Luxor
6 Swimming pool- 4 Fountains - 
12 منشأ مائي + خرسانة وميكانيكا"	Luxor	Working	P.Zone	Sub- Contractor	Ahmed Emad		Survey Manager	0 12 80987204
2605	"Four Seasonsn Hotel - Luxor
6 Swimming pool- 4 Fountains - 
12 منشأ مائي + خرسانة وميكانيكا"	Luxor	Working	P.Zone	Sub- Contractor	Mohamed Sabry	403/1003	Civil Supervisor	0 10 60289473
2605	"Four Seasonsn Hotel - Luxor
6 Swimming pool- 4 Fountains - 
12 منشأ مائي + خرسانة وميكانيكا"	Luxor	Working	P.Zone	Sub- Contractor	Ali Khalifa Nazeef	249	Civil Supervisor	0 10 92565747
2605	"Four Seasonsn Hotel - Luxor
6 Swimming pool- 4 Fountains - 
12 منشأ مائي + خرسانة وميكانيكا"	Luxor	Working	P.Zone	Sub- Contractor	Sayed Salah	1	Technical Supervisor	0 1090043116
2605	"Four Seasonsn Hotel - Luxor
6 Swimming pool- 4 Fountains - 
12 منشأ مائي + خرسانة وميكانيكا"	Luxor	Working	P.Zone	Sub- Contractor	Ayman Ali	210	Surveyor	
2605	"Four Seasonsn Hotel - Luxor
6 Swimming pool- 4 Fountains - 
12 منشأ مائي + خرسانة وميكانيكا"	Luxor	Working	P.Zone	Sub- Contractor	Mahmoud Medhat	123	Technical Supervisor	0 1065736661
"""

def parse_data(raw):
    lines = raw.strip().split('\n')
    rows = []
    for line in lines:
        if not line.strip(): continue
        parts = line.split('\t')
        if len(parts) >= 9:
            code = parts[0].strip()
            proj_name = parts[1].strip()
            area = parts[2].strip()
            status = parts[3].strip()
            company = parts[4].strip()
            owner_role = parts[5].strip()
            name = parts[6].strip()
            emp_code = parts[7].strip()
            title = parts[8].strip()
            mobile = parts[9].strip() if len(parts) > 9 else ''
            
            if code == 'NA' and 'Concord City Gate' in proj_name:
                code = '2406'
            
            rows.append({
                'project_code': code,
                'project_name': proj_name,
                'company': company,
                'owner_role': owner_role,
                'name': name,
                'emp_code': emp_code,
                'title': title,
                'mobile': mobile
            })
    return rows

if __name__ == '__main__':
    rows = parse_data(RAW_TSV)
    print(f'Parsed {len(rows)} rows from TSV.')
