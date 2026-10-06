import { Match } from '../types';

export interface EvaluatedPredictionResult {
  evaluatedPredictions: any[];
  totalCoins: number; // Net available coins (totalEarnedCoins - totalCoinsSpent)
  totalEarnedCoins: number; // Total rewards earned
  totalCoinsSpent: number; // Total prediction fees spent
  exactPredictionsCount: number;
  winningPredictions: any[];
}

export const FINISHED_MATCHES_CATALOG: Record<string, {
  homeScore: number;
  awayScore: number;
  homeTeamAr?: string;
  awayTeamAr?: string;
  homeTeam?: string;
  awayTeam?: string;
  customCoinsReward?: number;
}> = {
  // Egyptian League & Cup
  'm_egy_zamalek_abuqir_sep8': { homeScore: 2, awayScore: 0, homeTeamAr: 'الزمالك', awayTeamAr: 'سماد أبوقير', customCoinsReward: 50 },
  'm_egy_zamalek_abuqir': { homeScore: 2, awayScore: 0, homeTeamAr: 'الزمالك', awayTeamAr: 'سماد أبوقير', customCoinsReward: 50 },
  'm_egy_abuqir_zamalek': { homeScore: 0, awayScore: 2, homeTeamAr: 'سماد أبوقير', awayTeamAr: 'الزمالك', customCoinsReward: 50 },
  'm_egy_cup_enppi_degla': { homeScore: 1, awayScore: 3, homeTeamAr: 'الشرقية إنبي', awayTeamAr: 'وادي دجلة', customCoinsReward: 50 },
  'm_egy_cup_degla_enppi': { homeScore: 3, awayScore: 1, homeTeamAr: 'وادي دجلة', awayTeamAr: 'الشرقية إنبي', customCoinsReward: 50 },
  'm_egy_cup_qanah_gouna': { homeScore: 1, awayScore: 1, homeTeamAr: 'القناة', awayTeamAr: 'الجونة', customCoinsReward: 50 },
  'm_egy_cup_gouna_qanah': { homeScore: 1, awayScore: 1, homeTeamAr: 'الجونة', awayTeamAr: 'القناة', customCoinsReward: 50 },
  'm_egy_cup_pyramids_aboqir': { homeScore: 2, awayScore: 0, homeTeamAr: 'بيراميدز', awayTeamAr: 'ابو قير للاسمدة', customCoinsReward: 50 },
  'm_egy_cup_mokawloon_masry': { homeScore: 2, awayScore: 3, homeTeamAr: 'المقاولون العرب', awayTeamAr: 'المصري', customCoinsReward: 50 },
  'm_egy_cup_future_mahalla': { homeScore: 2, awayScore: 0, homeTeamAr: 'مودرن سبورت', awayTeamAr: 'غزل المحلة', customCoinsReward: 50 },
  'm_egy_gouna_future': { homeScore: 1, awayScore: 1, homeTeamAr: 'مودرن سبورت', awayTeamAr: 'الجونة', customCoinsReward: 50 },
  'm_egy_ahly_enppi': { homeScore: 3, awayScore: 2, homeTeamAr: 'الأهلي', awayTeamAr: 'الشرقية إنبي', customCoinsReward: 50 },
  'm_egy_cup_smouha_petrol': { homeScore: 0, awayScore: 0, homeTeamAr: 'سموحة', awayTeamAr: 'بترول أسيوط', customCoinsReward: 50 },
  'm_egy_cup_bank_zamalek': { homeScore: 0, awayScore: 3, homeTeamAr: 'البنك الاهلي', awayTeamAr: 'الزمالك', customCoinsReward: 50 },
  'm_egy_cup_petrojet_gaish': { homeScore: 2, awayScore: 3, homeTeamAr: 'منتخب السويس بتروجت', awayTeamAr: 'طلائع الجيش', customCoinsReward: 50 },
  'm_egy_cup_zed_ahly': { homeScore: 0, awayScore: 2, homeTeamAr: 'زد', awayTeamAr: 'الأهلي', customCoinsReward: 100 },
  'm_egy_cup_ahly_zed': { homeScore: 2, awayScore: 0, homeTeamAr: 'الأهلي', awayTeamAr: 'زد', customCoinsReward: 100 },
  'm_egy_cup_ittihad_ceramica': { homeScore: 1, awayScore: 3, homeTeamAr: 'الاتحاد السكندري', awayTeamAr: 'سيراميكا كليوباترا', customCoinsReward: 50 },
  'm_egy_cup_ceramica_ittihad': { homeScore: 3, awayScore: 1, homeTeamAr: 'سيراميكا كليوباترا', awayTeamAr: 'الاتحاد السكندري', customCoinsReward: 50 },
  'm_sat_talaea_mokawloon': { homeScore: 1, awayScore: 0, homeTeamAr: 'طلائع الجيش', awayTeamAr: 'المقاولون العرب', customCoinsReward: 50 },
  'm_sat_mahalla_pyramids': { homeScore: 0, awayScore: 3, homeTeamAr: 'غزل المحلة', awayTeamAr: 'بيراميدز', customCoinsReward: 50 },
  'm_sat_masry_smouha': { homeScore: 1, awayScore: 0, homeTeamAr: 'المصري', awayTeamAr: 'سموحة', customCoinsReward: 50 },
  'm_egy_zamalek_pyramids': { homeScore: 1, awayScore: 1, homeTeamAr: 'الزمالك', awayTeamAr: 'بيراميدز', customCoinsReward: 50 },
  'm_egy_ahly_smouha': { homeScore: 1, awayScore: 0, homeTeamAr: 'الأهلي', awayTeamAr: 'سموحة', homeTeam: 'Al Ahly SC', awayTeam: 'Smouha SC', customCoinsReward: 50 },
  'm_egy_ahly_smouha_sep3': { homeScore: 1, awayScore: 0, homeTeamAr: 'الأهلي', awayTeamAr: 'سموحة', homeTeam: 'Al Ahly SC', awayTeam: 'Smouha SC', customCoinsReward: 50 },

  // Premier League
  'm_epl_mancity_coventry_sep5': { homeScore: 1, awayScore: 0, homeTeamAr: 'مانشستر سيتي', awayTeamAr: 'كوفنتري سيتي', homeTeam: 'Manchester City', awayTeam: 'Coventry City', customCoinsReward: 50 },
  'm_epl_fulham_crystalpalace_sep5': { homeScore: 2, awayScore: 3, homeTeamAr: 'فولهام', awayTeamAr: 'كريستال بالاس', homeTeam: 'Fulham FC', awayTeam: 'Crystal Palace', customCoinsReward: 50 },
  'm_epl_manutd_ipswich': { homeScore: 5, awayScore: 2, homeTeamAr: 'مان يونايتد', awayTeamAr: 'إيبسويتش تاون', homeTeam: 'Manchester United', awayTeam: 'Ipswich Town', customCoinsReward: 50 },
  'm_epl_ipswich_manutd': { homeScore: 2, awayScore: 5, homeTeamAr: 'إيبسويتش تاون', awayTeamAr: 'مان يونايتد', homeTeam: 'Ipswich Town', awayTeam: 'Manchester United', customCoinsReward: 50 },
  'm_epl_chelsea_brighton': { homeScore: 4, awayScore: 3, homeTeamAr: 'تشيلسي', awayTeamAr: 'برايتون', homeTeam: 'Chelsea FC', awayTeam: 'Brighton & Hove Albion', customCoinsReward: 50 },
  'm_epl_brighton_chelsea': { homeScore: 3, awayScore: 4, homeTeamAr: 'برايتون', awayTeamAr: 'تشيلسي', homeTeam: 'Brighton & Hove Albion', awayTeam: 'Chelsea FC', customCoinsReward: 50 },
  'm_epl_sunderland_fulham': { homeScore: 1, awayScore: 0, homeTeamAr: 'سندرلاند', awayTeamAr: 'فولهام', homeTeam: 'Sunderland AFC', awayTeam: 'Fulham FC', customCoinsReward: 50 },
  'm_epl_fulham_sunderland': { homeScore: 0, awayScore: 1, homeTeamAr: 'فولهام', awayTeamAr: 'سندرلاند', homeTeam: 'Fulham FC', awayTeam: 'Sunderland AFC', customCoinsReward: 50 },
  'm_epl_leeds_brentford': { homeScore: 1, awayScore: 1, homeTeamAr: 'ليدز', awayTeamAr: 'برينتفورد', homeTeam: 'Leeds United', awayTeam: 'Brentford FC', customCoinsReward: 50 },
  'm_epl_brentford_leeds': { homeScore: 1, awayScore: 1, homeTeamAr: 'برينتفورد', awayTeamAr: 'ليدز', homeTeam: 'Brentford FC', awayTeam: 'Leeds United', customCoinsReward: 50 },
  'm_epl_tottenham_newcastle': { homeScore: 0, awayScore: 2, homeTeamAr: 'توتنهام', awayTeamAr: 'نيوكاسل يونايتد', homeTeam: 'Tottenham Hotspur', awayTeam: 'Newcastle United', customCoinsReward: 50 },
  'm_epl_newcastle_tottenham': { homeScore: 2, awayScore: 0, homeTeamAr: 'نيوكاسل يونايتد', awayTeamAr: 'توتنهام', homeTeam: 'Newcastle United', awayTeam: 'Tottenham Hotspur', customCoinsReward: 50 },
  'm_epl_coventry_hull': { homeScore: 0, awayScore: 1, homeTeamAr: 'كوفنتري سيتي', awayTeamAr: 'هال سيتي', homeTeam: 'Coventry City', awayTeam: 'Hull City', customCoinsReward: 50 },
  'm_epl_hull_coventry': { homeScore: 1, awayScore: 0, homeTeamAr: 'هال سيتي', awayTeamAr: 'كوفنتري سيتي', homeTeam: 'Hull City', awayTeam: 'Coventry City', customCoinsReward: 50 },
  'm_epl_bournemouth_everton': { homeScore: 1, awayScore: 1, homeTeamAr: 'بورنموث', awayTeamAr: 'إيفرتون', homeTeam: 'AFC Bournemouth', awayTeam: 'Everton FC', customCoinsReward: 50 },
  'm_epl_everton_bournemouth': { homeScore: 1, awayScore: 1, homeTeamAr: 'إيفرتون', awayTeamAr: 'بورنموث', homeTeam: 'Everton FC', awayTeam: 'AFC Bournemouth', customCoinsReward: 50 },
  'm_epl_liverpool_forest': { homeScore: 2, awayScore: 2, homeTeamAr: 'ليفربول', awayTeamAr: 'نوتينغهام فورست', homeTeam: 'Liverpool FC', awayTeam: 'Nottingham Forest', customCoinsReward: 50 },
  'm_epl_forest_liverpool': { homeScore: 2, awayScore: 2, homeTeamAr: 'نوتينغهام فورست', awayTeamAr: 'ليفربول', homeTeam: 'Nottingham Forest', awayTeam: 'Liverpool FC', customCoinsReward: 50 },
  'm_epl_palace_mancity': { homeScore: 1, awayScore: 4, homeTeamAr: 'كريستال بالاس', awayTeamAr: 'مانشستر سيتي', customCoinsReward: 50 },
  'm_epl_mancity_palace': { homeScore: 4, awayScore: 1, homeTeamAr: 'مانشستر سيتي', awayTeamAr: 'كريستال بالاس', customCoinsReward: 50 },
  'm_epl_fulham_chelsea': { homeScore: 3, awayScore: 2, homeTeamAr: 'تشيلسي', awayTeamAr: 'فولهام', customCoinsReward: 50 },
  'm_epl_chelsea_fulham': { homeScore: 3, awayScore: 2, homeTeamAr: 'تشيلسي', awayTeamAr: 'فولهام', customCoinsReward: 50 },
  'm_fri_coventry_arsenal': { homeScore: 0, awayScore: 3, homeTeamAr: 'كوفنتري', awayTeamAr: 'أرسنال', customCoinsReward: 50 },
  'm_epl_newcastle_mancity': { homeScore: 1, awayScore: 3, homeTeamAr: 'نيوكاسل', awayTeamAr: 'مانشستر سيتي', customCoinsReward: 50 },
  'm_epl_tottenham_arsenal': { homeScore: 1, awayScore: 2, homeTeamAr: 'توتنهام', awayTeamAr: 'أرسنال', customCoinsReward: 50 },
  'm_epl_liverpool_wolves': { homeScore: 2, awayScore: 0, homeTeamAr: 'ليفربول', awayTeamAr: 'وولفرهامبتون', customCoinsReward: 50 },
  'm_epl_everton_astonvilla': { homeScore: 0, awayScore: 1, homeTeamAr: 'إيفرتون', awayTeamAr: 'أستون فيلا', customCoinsReward: 50 },
  'm_epl_astonvilla_arsenal': { homeScore: 0, awayScore: 1, homeTeamAr: 'أستون فيلا', awayTeamAr: 'آرسنال', homeTeam: 'Aston Villa', awayTeam: 'Arsenal FC', customCoinsReward: 50 },
  'm_epl_arsenal_astonvilla': { homeScore: 1, awayScore: 0, homeTeamAr: 'آرسنال', awayTeamAr: 'أستون فيلا', homeTeam: 'Arsenal FC', awayTeam: 'Aston Villa', customCoinsReward: 50 },
  'm_epl_ipswich_liverpool_sep4': { homeScore: 0, awayScore: 2, homeTeamAr: 'إيبسويتش تاون', awayTeamAr: 'ليفربول', homeTeam: 'Ipswich Town', awayTeam: 'Liverpool FC', customCoinsReward: 50 },
  'm_epl_liverpool_ipswich_sep4': { homeScore: 2, awayScore: 0, homeTeamAr: 'ليفربول', awayTeamAr: 'إيبسويتش تاون', homeTeam: 'Liverpool FC', awayTeam: 'Ipswich Town', customCoinsReward: 50 },
  'm_epl_ipswich_liverpool': { homeScore: 0, awayScore: 2, homeTeamAr: 'إيبسويتش تاون', awayTeamAr: 'ليفربول', homeTeam: 'Ipswich Town', awayTeam: 'Liverpool FC', customCoinsReward: 50 },
  'm_epl_liverpool_ipswich': { homeScore: 2, awayScore: 0, homeTeamAr: 'ليفربول', awayTeamAr: 'إيبسويتش تاون', homeTeam: 'Liverpool FC', awayTeam: 'Ipswich Town', customCoinsReward: 50 },

  // La Liga
  'm_laliga_osasuna_getafe': { homeScore: 1, awayScore: 0, homeTeamAr: 'أوساسونا', awayTeamAr: 'خيتافي', homeTeam: 'CA Osasuna', awayTeam: 'Getafe CF', customCoinsReward: 50 },
  'm_laliga_getafe_osasuna': { homeScore: 0, awayScore: 1, homeTeamAr: 'خيتافي', awayTeamAr: 'أوساسونا', homeTeam: 'Getafe CF', awayTeam: 'CA Osasuna', customCoinsReward: 50 },
  'm_laliga_barcelona_rayo': { homeScore: 5, awayScore: 2, homeTeamAr: 'برشلونة', awayTeamAr: 'رايو فاليكانو', homeTeam: 'FC Barcelona', awayTeam: 'Rayo Vallecano', customCoinsReward: 50 },
  'm_laliga_rayo_barcelona': { homeScore: 2, awayScore: 5, homeTeamAr: 'رايو فاليكانو', awayTeamAr: 'برشلونة', homeTeam: 'Rayo Vallecano', awayTeam: 'FC Barcelona', customCoinsReward: 50 },
  'm_laliga_celta_bilbao': { homeScore: 0, awayScore: 2, homeTeamAr: 'سلتا فيغو', awayTeamAr: 'أتلتيك بيلباو', homeTeam: 'Celta Vigo', awayTeam: 'Athletic Club', customCoinsReward: 50 },
  'm_laliga_bilbao_celta': { homeScore: 2, awayScore: 0, homeTeamAr: 'أتلتيك بيلباو', awayTeamAr: 'سلتا فيغو', homeTeam: 'Athletic Club', awayTeam: 'Celta Vigo', customCoinsReward: 50 },
  'm_laliga_deportivo_valencia': { homeScore: 3, awayScore: 1, homeTeamAr: 'ديبورتيفو', awayTeamAr: 'فالنسيا', homeTeam: 'Deportivo La Coruña', awayTeam: 'Valencia CF', customCoinsReward: 50 },
  'm_laliga_valencia_deportivo': { homeScore: 1, awayScore: 3, homeTeamAr: 'فالنسيا', awayTeamAr: 'ديبورتيفو', homeTeam: 'Valencia CF', awayTeam: 'Deportivo La Coruña', customCoinsReward: 50 },
  'm_laliga_real_malaga': { homeScore: 4, awayScore: 0, homeTeamAr: 'الريال', awayTeamAr: 'مالقا', homeTeam: 'Real Madrid', awayTeam: 'Málaga CF', customCoinsReward: 50 },
  'm_laliga_malaga_real': { homeScore: 0, awayScore: 4, homeTeamAr: 'مالقا', awayTeamAr: 'الريال', homeTeam: 'Málaga CF', awayTeam: 'Real Madrid', customCoinsReward: 50 },
  'm_laliga_alaves_villarreal': { homeScore: 1, awayScore: 0, homeTeamAr: 'ألافيس', awayTeamAr: 'فياريال', customCoinsReward: 50 },
  'm_laliga_villarreal_alaves': { homeScore: 0, awayScore: 1, homeTeamAr: 'فياريال', awayTeamAr: 'ألافيس', customCoinsReward: 50 },
  'm_laliga_racing_elche': { homeScore: 3, awayScore: 2, homeTeamAr: 'رسينغ', awayTeamAr: 'إلتشيه', customCoinsReward: 50 },
  'm_laliga_elche_racing': { homeScore: 2, awayScore: 3, homeTeamAr: 'إلتشيه', awayTeamAr: 'رسينغ', customCoinsReward: 50 },
  'm_laliga_celta_osasuna': { homeScore: 1, awayScore: 2, homeTeamAr: 'سلتا فيغو', awayTeamAr: 'أوساسونا', customCoinsReward: 50 },
  'm_laliga_osasuna_celta': { homeScore: 2, awayScore: 1, homeTeamAr: 'أوساسونا', awayTeamAr: 'سلتا فيغو', customCoinsReward: 50 },
  'm_laliga_barcelona_bilbao': { homeScore: 2, awayScore: 0, homeTeamAr: 'برشلونة', awayTeamAr: 'أتلتيك بيلباو', customCoinsReward: 50 },
  'm_laliga_bilbao_barcelona': { homeScore: 0, awayScore: 2, homeTeamAr: 'أتلتيك بيلباو', awayTeamAr: 'برشلونة', customCoinsReward: 50 },
  'm_laliga_valencia_betis': { homeScore: 0, awayScore: 1, homeTeamAr: 'فالنسيا', awayTeamAr: 'ريال بيتيس', customCoinsReward: 50 },
  'm_laliga_atletico_villarreal': { homeScore: 2, awayScore: 2, homeTeamAr: 'أتلتيكو مدريد', awayTeamAr: 'فياريال', customCoinsReward: 50 },
  'm_laliga_elche_barcelona': { homeScore: 0, awayScore: 5, homeTeamAr: 'إلتشي', awayTeamAr: 'برشلونة', customCoinsReward: 50 },
  'm_laliga_real_sociedad': { homeScore: 4, awayScore: 1, homeTeamAr: 'الريال', awayTeamAr: 'ريال سوسيداد', customCoinsReward: 50 },
  'm_wed_barcelona_alahly': { homeScore: 2, awayScore: 1, homeTeamAr: 'برشلونة', awayTeamAr: 'الأهلي', customCoinsReward: 50 },
  'm_wed_malaga_atletico': { homeScore: 0, awayScore: 2, homeTeamAr: 'مالقا', awayTeamAr: 'أتلتيكو مدريد', customCoinsReward: 50 },
  'm_fri_betis_sociedad': { homeScore: 1, awayScore: 0, homeTeamAr: 'ريال بيتيس', awayTeamAr: 'ريال سوسيداد', customCoinsReward: 50 },
  'm_sat_athletic_sevilla': { homeScore: 1, awayScore: 3, homeTeamAr: 'أتلتيك بيلباو', awayTeamAr: 'إشبيلية', customCoinsReward: 50 },
  'm_sat_valencia_celta': { homeScore: 0, awayScore: 0, homeTeamAr: 'فالنسيا', awayTeamAr: 'سيلتا فيجو', customCoinsReward: 50 },
  'm_sat_espanyol_realmadrid': { homeScore: 1, awayScore: 2, homeTeamAr: 'إسبانيول', awayTeamAr: 'ريال مدريد', customCoinsReward: 50 },
  'm_laliga_realmadrid_barcelona': { homeScore: 2, awayScore: 1, homeTeamAr: 'ريال مدريد', awayTeamAr: 'برشلونة', customCoinsReward: 50 },
  'm_laliga_levante_betis': { homeScore: 5, awayScore: 2, homeTeamAr: 'ليفانتي', awayTeamAr: 'ريال بيتيس', homeTeam: 'Levante UD', awayTeam: 'Real Betis', customCoinsReward: 50 },
  'm_laliga_betis_levante': { homeScore: 2, awayScore: 5, homeTeamAr: 'ريال بيتيس', awayTeamAr: 'ليفانتي', homeTeam: 'Real Betis', awayTeam: 'Levante UD', customCoinsReward: 50 },
  'm_laliga_sociedad_espanyol': { homeScore: 2, awayScore: 1, homeTeamAr: 'ريال سوسيداد', awayTeamAr: 'إسبانيول', homeTeam: 'Real Sociedad', awayTeam: 'RCD Espanyol', customCoinsReward: 50 },
  'm_laliga_espanyol_sociedad': { homeScore: 1, awayScore: 2, homeTeamAr: 'إسبانيول', awayTeamAr: 'ريال سوسيداد', homeTeam: 'RCD Espanyol', awayTeam: 'Real Sociedad', customCoinsReward: 50 },
  'm_laliga_sociedad_celta': { homeScore: 0, awayScore: 0, homeTeamAr: 'ريال سوسيداد', awayTeamAr: 'سلتا فيغو', homeTeam: 'Real Sociedad', awayTeam: 'Celta Vigo', customCoinsReward: 50 },
  'm_laliga_celta_sociedad': { homeScore: 0, awayScore: 0, homeTeamAr: 'سلتا فيغو', awayTeamAr: 'ريال سوسيداد', homeTeam: 'Celta Vigo', awayTeam: 'Real Sociedad', customCoinsReward: 50 },
  'm_laliga_sevilla_atletico': { homeScore: 1, awayScore: 3, homeTeamAr: 'إشبيلية', awayTeamAr: 'أتلتيكو مدريد', homeTeam: 'Sevilla FC', awayTeam: 'Atletico Madrid', customCoinsReward: 50 },
  'm_laliga_atletico_sevilla': { homeScore: 3, awayScore: 1, homeTeamAr: 'أتلتيكو مدريد', awayTeamAr: 'إشبيلية', homeTeam: 'Atletico Madrid', awayTeam: 'Sevilla FC', customCoinsReward: 50 },

  // Ligue 1
  'm_ligue1_monaco_marseille': { homeScore: 2, awayScore: 0, homeTeamAr: 'موناكو', awayTeamAr: 'أولمبيك مارسيليا', homeTeam: 'AS Monaco', awayTeam: 'Olympique de Marseille', customCoinsReward: 50 },
  'm_ligue1_marseille_monaco': { homeScore: 0, awayScore: 2, homeTeamAr: 'أولمبيك مارسيليا', awayTeamAr: 'موناكو', homeTeam: 'Olympique de Marseille', awayTeam: 'AS Monaco', customCoinsReward: 50 },
  'm_ligue1_paris_nice': { homeScore: 3, awayScore: 0, homeTeamAr: 'باريس', awayTeamAr: 'نيس', homeTeam: 'Paris FC', awayTeam: 'OGC Nice', customCoinsReward: 50 },
  'm_ligue1_nice_paris': { homeScore: 0, awayScore: 3, homeTeamAr: 'نيس', awayTeamAr: 'باريس', homeTeam: 'OGC Nice', awayTeam: 'Paris FC', customCoinsReward: 50 },
  'm_ligue1_rennes_lemans': { homeScore: 3, awayScore: 2, homeTeamAr: 'رين', awayTeamAr: 'نادي لومان', homeTeam: 'Stade Rennais FC', awayTeam: 'Le Mans FC', customCoinsReward: 50 },
  'm_ligue1_lemans_rennes': { homeScore: 2, awayScore: 3, homeTeamAr: 'نادي لومان', awayTeamAr: 'رين', homeTeam: 'Le Mans FC', awayTeam: 'Stade Rennais FC', customCoinsReward: 50 },
  'm_ligue1_auxerre_angers': { homeScore: 1, awayScore: 3, homeTeamAr: 'أوكسير', awayTeamAr: 'أنجيه', homeTeam: 'AJ Auxerre', awayTeam: 'Angers SCO', customCoinsReward: 50 },
  'm_ligue1_angers_auxerre': { homeScore: 3, awayScore: 1, homeTeamAr: 'أنجيه', awayTeamAr: 'أوكسير', homeTeam: 'Angers SCO', awayTeam: 'AJ Auxerre', customCoinsReward: 50 },
  'm_ligue1_brest_toulouse': { homeScore: 2, awayScore: 2, homeTeamAr: 'بريست', awayTeamAr: 'تولوز', homeTeam: 'Stade Brestois 29', awayTeam: 'Toulouse FC', customCoinsReward: 50 },
  'm_ligue1_toulouse_brest': { homeScore: 2, awayScore: 2, homeTeamAr: 'تولوز', awayTeamAr: 'بريست', homeTeam: 'Toulouse FC', awayTeam: 'Stade Brestois 29', customCoinsReward: 50 },
  'm_ligue1_lyon_lehavre': { homeScore: 1, awayScore: 1, homeTeamAr: 'أولمبيك ليون', awayTeamAr: 'لوهافر', homeTeam: 'Olympique Lyonnais', awayTeam: 'Le Havre AC', customCoinsReward: 50 },
  'm_ligue1_lehavre_lyon': { homeScore: 1, awayScore: 1, homeTeamAr: 'لوهافر', awayTeamAr: 'أولمبيك ليون', homeTeam: 'Le Havre AC', awayTeam: 'Olympique Lyonnais', customCoinsReward: 50 },
  'm_ligue1_lorient_troyes': { homeScore: 1, awayScore: 2, homeTeamAr: 'لوريان', awayTeamAr: 'تروا', homeTeam: 'FC Lorient', awayTeam: 'ESTAC Troyes', customCoinsReward: 50 },
  'm_ligue1_troyes_lorient': { homeScore: 2, awayScore: 1, homeTeamAr: 'تروا', awayTeamAr: 'لوريان', homeTeam: 'ESTAC Troyes', awayTeam: 'FC Lorient', customCoinsReward: 50 },
  'm_ligue1_strasbourg_lens': { homeScore: 2, awayScore: 1, homeTeamAr: 'ستراسبورغ', awayTeamAr: 'لانس', homeTeam: 'RC Strasbourg', awayTeam: 'RC Lens', customCoinsReward: 50 },
  'm_ligue1_lens_strasbourg': { homeScore: 1, awayScore: 2, homeTeamAr: 'لانس', awayTeamAr: 'ستراسبورغ', homeTeam: 'RC Lens', awayTeam: 'RC Strasbourg', customCoinsReward: 50 },
  'm_ligue1_lille_psg': { homeScore: 2, awayScore: 2, homeTeamAr: 'ليل', awayTeamAr: 'باريس سان جيرمان', customCoinsReward: 50 },
  'm_ligue1_psg_lille': { homeScore: 2, awayScore: 2, homeTeamAr: 'باريس سان جيرمان', awayTeamAr: 'ليل', customCoinsReward: 50 },
  'm_ligue1_lille_angers': { homeScore: 2, awayScore: 0, homeTeamAr: 'ليل', awayTeamAr: 'أنجيه', customCoinsReward: 50 },
  'm_ligue1_rennes_psg': { homeScore: 2, awayScore: 2, homeTeamAr: 'رين', awayTeamAr: 'بي اس جي', customCoinsReward: 50 },

  // UCL & Others
  'm_ucl_psg_bayern': { homeScore: 2, awayScore: 2, homeTeamAr: 'باريس', awayTeamAr: 'بايرن ميونخ', customCoinsReward: 50 },
  'm_afcon_egypt_senegal': { homeScore: 1, awayScore: 0, homeTeamAr: 'مصر', awayTeamAr: 'السنغال', customCoinsReward: 50 },

  // Matches finished on Sunday 9/6 (Added per official final scorelines)
  'm_epl_everton_manutd_sep6': { homeScore: 2, awayScore: 2, homeTeamAr: 'إيفرتون', awayTeamAr: 'مان يونايتد', homeTeam: 'Everton FC', awayTeam: 'Manchester United', customCoinsReward: 50 },
  'm_epl_everton_manutd': { homeScore: 2, awayScore: 2, homeTeamAr: 'إيفرتون', awayTeamAr: 'مان يونايتد', homeTeam: 'Everton FC', awayTeam: 'Manchester United', customCoinsReward: 50 },
  'm_laliga_valencia_barcelona_sep6': { homeScore: 0, awayScore: 5, homeTeamAr: 'فالنسيا', awayTeamAr: 'برشلونة', homeTeam: 'Valencia CF', awayTeam: 'FC Barcelona', customCoinsReward: 50 },
  'm_laliga_valencia_barcelona': { homeScore: 0, awayScore: 5, homeTeamAr: 'فالنسيا', awayTeamAr: 'برشلونة', homeTeam: 'Valencia CF', awayTeam: 'FC Barcelona', customCoinsReward: 50 },
  'm_superlig_trabzonspor_genclerbirligi_sep6': { homeScore: 2, awayScore: 0, homeTeamAr: 'طرابزون سبور', awayTeamAr: 'غنتشليربيرليغي', homeTeam: 'Trabzonspor', awayTeam: 'Gençlerbirliği SK', customCoinsReward: 50 },
  'm_superlig_trabzonspor_genclerbirligi': { homeScore: 2, awayScore: 0, homeTeamAr: 'طرابزون سبور', awayTeamAr: 'غنتشليربيرليغي', homeTeam: 'Trabzonspor', awayTeam: 'Gençlerbirliği SK', customCoinsReward: 50 },

  // UEFA Champions League: Real Madrid 2 - 1 Inter Milan (150 coins reward)
  'm_ucl_realmadrid_inter_sep8': { homeScore: 2, awayScore: 1, homeTeamAr: 'الريال', awayTeamAr: 'الإنتر', homeTeam: 'Real Madrid', awayTeam: 'Inter Milan', customCoinsReward: 150 },
  'm_ucl_realmadrid_inter': { homeScore: 2, awayScore: 1, homeTeamAr: 'الريال', awayTeamAr: 'الإنتر', homeTeam: 'Real Madrid', awayTeam: 'Inter Milan', customCoinsReward: 150 },
  'm_ucl_inter_realmadrid': { homeScore: 1, awayScore: 2, homeTeamAr: 'الإنتر', awayTeamAr: 'الريال', homeTeam: 'Inter Milan', awayTeam: 'Real Madrid', customCoinsReward: 150 },

  // Egyptian Premier League: Al Mokawloon 1 - 1 Al Ahly (50 coins reward)
  'm_egy_mokawloon_ahly_sep9': { homeScore: 1, awayScore: 1, homeTeamAr: 'المقاولون', awayTeamAr: 'الأهلي', homeTeam: 'Al Mokawloon Al Arab', awayTeam: 'Al Ahly SC', customCoinsReward: 50 },
  'm_egy_mokawloon_ahly': { homeScore: 1, awayScore: 1, homeTeamAr: 'المقاولون', awayTeamAr: 'الأهلي', homeTeam: 'Al Mokawloon Al Arab', awayTeam: 'Al Ahly SC', customCoinsReward: 50 },
  'm_egy_ahly_mokawloon_sep9': { homeScore: 1, awayScore: 1, homeTeamAr: 'الأهلي', awayTeamAr: 'المقاولون', homeTeam: 'Al Ahly SC', awayTeam: 'Al Mokawloon Al Arab', customCoinsReward: 50 },
  'm_egy_ahly_mokawloon': { homeScore: 1, awayScore: 1, homeTeamAr: 'الأهلي', awayTeamAr: 'المقاولون', homeTeam: 'Al Ahly SC', awayTeam: 'Al Mokawloon Al Arab', customCoinsReward: 50 },

  // Saturday 9/12 Matches
  // Premier League: Liverpool 0 - 0 Fulham (50 coins reward)
  'm_epl_liverpool_fulham_sep12': { homeScore: 0, awayScore: 0, homeTeamAr: 'ليفربول', awayTeamAr: 'فولهام', homeTeam: 'Liverpool FC', awayTeam: 'Fulham FC', customCoinsReward: 50 },
  'm_epl_liverpool_fulham': { homeScore: 0, awayScore: 0, homeTeamAr: 'ليفربول', awayTeamAr: 'فولهام', homeTeam: 'Liverpool FC', awayTeam: 'Fulham FC', customCoinsReward: 50 },
  'm_epl_fulham_liverpool_sep12': { homeScore: 0, awayScore: 0, homeTeamAr: 'فولهام', awayTeamAr: 'ليفربول', homeTeam: 'Fulham FC', awayTeam: 'Liverpool FC', customCoinsReward: 50 },

  // Saudi Pro League: Al Khaleej 1 - 1 Al Nassr (50 coins reward)
  'm_spl_alkhaleej_alnassr_sep12': { homeScore: 1, awayScore: 1, homeTeamAr: 'الخليج', awayTeamAr: 'النصر', homeTeam: 'Al Khaleej FC', awayTeam: 'Al Nassr FC', customCoinsReward: 50 },
  'm_spl_alkhaleej_alnassr': { homeScore: 1, awayScore: 1, homeTeamAr: 'الخليج', awayTeamAr: 'النصر', homeTeam: 'Al Khaleej FC', awayTeam: 'Al Nassr FC', customCoinsReward: 50 },
  'm_spl_alnassr_alkhaleej_sep12': { homeScore: 1, awayScore: 1, homeTeamAr: 'النصر', awayTeamAr: 'الخليج', homeTeam: 'Al Nassr FC', awayTeam: 'Al Khaleej FC', customCoinsReward: 50 },

  // La Liga: Real Madrid 4 - 1 Rayo Vallecano (50 coins reward)
  'm_laliga_realmadrid_rayo_sep12': { homeScore: 4, awayScore: 1, homeTeamAr: 'الريال', awayTeamAr: 'رايو فاليكانو', homeTeam: 'Real Madrid', awayTeam: 'Rayo Vallecano', customCoinsReward: 50 },
  'm_laliga_realmadrid_rayo': { homeScore: 4, awayScore: 1, homeTeamAr: 'الريال', awayTeamAr: 'رايو فاليكانو', homeTeam: 'Real Madrid', awayTeam: 'Rayo Vallecano', customCoinsReward: 50 },
  'm_laliga_rayo_realmadrid_sep12': { homeScore: 1, awayScore: 4, homeTeamAr: 'رايو فاليكانو', awayTeamAr: 'الريال', homeTeam: 'Rayo Vallecano', awayTeam: 'Real Madrid', customCoinsReward: 50 },

  // Premier League: Manchester United 0 - 1 Manchester City (50 coins reward per user directive)
  'm_epl_manutd_mancity_sep13': { homeScore: 0, awayScore: 1, homeTeamAr: 'مان يونايتد', awayTeamAr: 'مان سيتي', homeTeam: 'Manchester United', awayTeam: 'Manchester City', customCoinsReward: 50 },
  'm_epl_manutd_mancity': { homeScore: 0, awayScore: 1, homeTeamAr: 'مان يونايتد', awayTeamAr: 'مان سيتي', homeTeam: 'Manchester United', awayTeam: 'Manchester City', customCoinsReward: 50 },
  'm_epl_mancity_manutd_sep13': { homeScore: 1, awayScore: 0, homeTeamAr: 'مان سيتي', awayTeamAr: 'مان يونايتد', homeTeam: 'Manchester City', awayTeam: 'Manchester United', customCoinsReward: 50 },
  'm_epl_mancity_manutd': { homeScore: 1, awayScore: 0, homeTeamAr: 'مان سيتي', awayTeamAr: 'مان يونايتد', homeTeam: 'Manchester City', awayTeam: 'Manchester United', customCoinsReward: 50 },

  // 1. Tottenham Hotspur 1 - 2 Arsenal FC (Sunday 9/6 18:30)
  'm_epl_tottenham_arsenal_sep6': { homeScore: 1, awayScore: 2, homeTeamAr: 'توتنهام', awayTeamAr: 'أرسنال', homeTeam: 'Tottenham Hotspur', awayTeam: 'Arsenal FC', customCoinsReward: 50 },
  'm_epl_arsenal_tottenham_sep6': { homeScore: 2, awayScore: 1, homeTeamAr: 'أرسنال', awayTeamAr: 'توتنهام', homeTeam: 'Arsenal FC', awayTeam: 'Tottenham Hotspur', customCoinsReward: 50 },

  // 2. Villarreal CF 2 - 2 Atlético Madrid (Sunday 9/6 20:00)
  'm_laliga_villarreal_atletico_sep6': { homeScore: 2, awayScore: 2, homeTeamAr: 'فياريال', awayTeamAr: 'أتلتيكو مدريد', homeTeam: 'Villarreal CF', awayTeam: 'Atletico Madrid', customCoinsReward: 50 },
  'm_laliga_atletico_villarreal_sep6': { homeScore: 2, awayScore: 2, homeTeamAr: 'أتلتيكو مدريد', awayTeamAr: 'فياريال', homeTeam: 'Atletico Madrid', awayTeam: 'Villarreal CF', customCoinsReward: 50 },

  // 3. Aston Villa 1 - 1 Chelsea FC (Sunday 9/6 21:00)
  'm_epl_astonvilla_chelsea_sep6': { homeScore: 1, awayScore: 1, homeTeamAr: 'أستون فيلا', awayTeamAr: 'تشيلسي', homeTeam: 'Aston Villa', awayTeam: 'Chelsea FC', customCoinsReward: 50 },
  'm_epl_chelsea_astonvilla_sep6': { homeScore: 1, awayScore: 1, homeTeamAr: 'تشيلسي', awayTeamAr: 'أستون فيلا', homeTeam: 'Chelsea FC', awayTeam: 'Aston Villa', customCoinsReward: 50 },

  // 4. Newcastle United 1 - 2 Liverpool FC (Monday 9/7 21:00)
  'm_epl_newcastle_liverpool_sep7': { homeScore: 1, awayScore: 2, homeTeamAr: 'نيوكاسل يونايتد', awayTeamAr: 'ليفربول', homeTeam: 'Newcastle United', awayTeam: 'Liverpool FC', customCoinsReward: 50 },
  'm_epl_liverpool_newcastle_sep7': { homeScore: 2, awayScore: 1, homeTeamAr: 'ليفربول', awayTeamAr: 'نيوكاسل يونايتد', homeTeam: 'Liverpool FC', awayTeam: 'Newcastle United', customCoinsReward: 50 },

  // 5. Real Madrid 2 - 0 Sevilla FC (Monday 9/7 22:00)
  'm_laliga_realmadrid_sevilla_sep7': { homeScore: 2, awayScore: 0, homeTeamAr: 'الريال', awayTeamAr: 'إشبيلية', homeTeam: 'Real Madrid', awayTeam: 'Sevilla FC', customCoinsReward: 50 },
  'm_laliga_sevilla_realmadrid_sep7': { homeScore: 0, awayScore: 2, homeTeamAr: 'إشبيلية', awayTeamAr: 'الريال', homeTeam: 'Sevilla FC', awayTeam: 'Real Madrid', customCoinsReward: 50 },

  // 6. Arsenal FC 2 - 2 Bayern Munich (Tuesday 9/8 22:00)
  'm_ucl_arsenal_bayern_sep8': { homeScore: 2, awayScore: 2, homeTeamAr: 'أرسنال', awayTeamAr: 'بايرن ميونخ', homeTeam: 'Arsenal FC', awayTeam: 'Bayern Munich', customCoinsReward: 50 },
  'm_ucl_bayern_arsenal_sep8': { homeScore: 2, awayScore: 2, homeTeamAr: 'بايرن ميونخ', awayTeamAr: 'أرسنال', homeTeam: 'Bayern Munich', awayTeam: 'Arsenal FC', customCoinsReward: 50 },

  // 7. El Gouna FC 0 - 2 Pyramids FC (Wednesday 9/9 17:00)
  'm_egy_gouna_pyramids_sep9': { homeScore: 0, awayScore: 2, homeTeamAr: 'الجونة', awayTeamAr: 'بيراميدز', homeTeam: 'El Gouna FC', awayTeam: 'Pyramids FC', customCoinsReward: 50 },
  'm_egy_pyramids_gouna_sep9': { homeScore: 2, awayScore: 0, homeTeamAr: 'بيراميدز', awayTeamAr: 'الجونة', homeTeam: 'Pyramids FC', awayTeam: 'El Gouna FC', customCoinsReward: 50 },

  // 8. FC Barcelona 3 - 1 Feyenoord (Wednesday 9/9 19:45)
  'm_ucl_barcelona_feyenoord_sep9': { homeScore: 3, awayScore: 1, homeTeamAr: 'برشلونة', awayTeamAr: 'فاينورد', homeTeam: 'FC Barcelona', awayTeam: 'Feyenoord', customCoinsReward: 50 },
  'm_ucl_feyenoord_barcelona_sep9': { homeScore: 1, awayScore: 3, homeTeamAr: 'فاينورد', awayTeamAr: 'برشلونة', homeTeam: 'Feyenoord', awayTeam: 'FC Barcelona', customCoinsReward: 50 },

  // 9. ENPPI SC 1 - 2 Al Ahly SC (Wednesday 9/9 20:00)
  'm_egy_enppi_ahly_sep9': { homeScore: 1, awayScore: 2, homeTeamAr: 'الشرقية إنبي', awayTeamAr: 'الأهلي', homeTeam: 'ENPPI SC', awayTeam: 'Al Ahly SC', customCoinsReward: 50 },
  'm_egy_ahly_enppi_sep9': { homeScore: 2, awayScore: 1, homeTeamAr: 'الأهلي', awayTeamAr: 'الشرقية إنبي', homeTeam: 'Al Ahly SC', awayTeam: 'ENPPI SC', customCoinsReward: 50 },

  // 10. Juventus FC 1 - 2 Paris Saint-Germain (Wednesday 9/9 22:00)
  'm_ucl_juventus_psg_sep9': { homeScore: 1, awayScore: 2, homeTeamAr: 'يوفنتوس', awayTeamAr: 'بي اس جي', homeTeam: 'Juventus FC', awayTeam: 'Paris Saint-Germain', customCoinsReward: 50 },
  'm_ucl_psg_juventus_sep9': { homeScore: 2, awayScore: 1, homeTeamAr: 'بي اس جي', awayTeamAr: 'يوفنتوس', homeTeam: 'Paris Saint-Germain', awayTeam: 'Juventus FC', customCoinsReward: 50 },

  // 11. Al Masry SC 1 - 0 Ismaily SC (Thursday 9/10 18:00)
  'm_egy_masry_ismaily_sep10': { homeScore: 1, awayScore: 0, homeTeamAr: 'المصري', awayTeamAr: 'الإسماعيلي', homeTeam: 'Al Masry SC', awayTeam: 'Ismaily SC', customCoinsReward: 50 },
  'm_egy_ismaily_masry_sep10': { homeScore: 0, awayScore: 1, homeTeamAr: 'الإسماعيلي', awayTeamAr: 'المصري', homeTeam: 'Ismaily SC', awayTeam: 'Al Masry SC', customCoinsReward: 50 },

  // 12. Al Ahly SC 2 - 0 Abo Qir Fertilizers (Tuesday 9/15) - Finished without coins reward
  'm_egy_ahly_abuqir_sep15': { homeScore: 2, awayScore: 0, homeTeamAr: 'الأهلي', awayTeamAr: 'سماد أبوقير', homeTeam: 'Al Ahly SC', awayTeam: 'Abo Qir Fertilizers', customCoinsReward: 0 },
  'm_egy_abuqir_ahly_sep15': { homeScore: 0, awayScore: 2, homeTeamAr: 'سماد أبوقير', awayTeamAr: 'الأهلي', homeTeam: 'Abo Qir Fertilizers', awayTeam: 'Al Ahly SC', customCoinsReward: 0 },

  // 13. Al Ain FC 4 - 0 Al Nassr FC (Tuesday 9/15) - Finished without coins reward
  'm_afc_alain_alnassr_sep15': { homeScore: 4, awayScore: 0, homeTeamAr: 'العين', awayTeamAr: 'النصر', homeTeam: 'Al Ain FC', awayTeam: 'Al Nassr FC', customCoinsReward: 0 },
  'm_afc_alnassr_alain_sep15': { homeScore: 0, awayScore: 4, homeTeamAr: 'النصر', awayTeamAr: 'العين', homeTeam: 'Al Nassr FC', awayTeam: 'Al Ain FC', customCoinsReward: 0 },

  // 14. Liverpool FC 3 - 1 Tottenham Hotspur (Tuesday 9/15) - Finished without coins reward
  'm_efl_liverpool_tottenham_sep15': { homeScore: 3, awayScore: 1, homeTeamAr: 'ليفربول', awayTeamAr: 'توتنهام', homeTeam: 'Liverpool FC', awayTeam: 'Tottenham Hotspur', customCoinsReward: 0 },
  'm_efl_tottenham_liverpool_sep15': { homeScore: 1, awayScore: 3, homeTeamAr: 'توتنهام', awayTeamAr: 'ليفربول', homeTeam: 'Tottenham Hotspur', awayTeam: 'Liverpool FC', customCoinsReward: 0 },

  // 15. Real Madrid 3 - 2 Elche CF / Elche CF 2 - 3 Real Madrid (Tuesday 9/15) - Finished without coins reward
  'm_laliga_elche_realmadrid_sep15': { homeScore: 2, awayScore: 3, homeTeamAr: 'إلتشيه', awayTeamAr: 'الريال', homeTeam: 'Elche CF', awayTeam: 'Real Madrid', customCoinsReward: 0 },
  'm_laliga_realmadrid_elche_sep15': { homeScore: 3, awayScore: 2, homeTeamAr: 'الريال', awayTeamAr: 'إلتشيه', homeTeam: 'Real Madrid', awayTeam: 'Elche CF', customCoinsReward: 0 },

  // 16. Ghazl El Mahalla 0 - 1 Zamalek SC (Wednesday 9/16) - Official Result (50 Coins Reward)
  'm_egy_mahalla_zamalek_sep16': { homeScore: 0, awayScore: 1, homeTeamAr: 'غزل المحلة', awayTeamAr: 'الزمالك', homeTeam: 'Ghazl El Mahalla', awayTeam: 'Zamalek SC', customCoinsReward: 50 },
  'm_egy_zamalek_mahalla_sep16': { homeScore: 1, awayScore: 0, homeTeamAr: 'الزمالك', awayTeamAr: 'غزل المحلة', homeTeam: 'Zamalek SC', awayTeam: 'Ghazl El Mahalla', customCoinsReward: 50 },

  // 17. Manchester United 2 - 3 Brighton & Hove Albion (Wednesday 9/16 - Capital One / EFL Cup) - Official Result (50 Coins Reward)
  'm_efl_manutd_brighton_sep16': { homeScore: 2, awayScore: 3, homeTeamAr: 'مان يونايتد', awayTeamAr: 'برايتون', homeTeam: 'Manchester United', awayTeam: 'Brighton & Hove Albion', customCoinsReward: 50 },
  'm_efl_brighton_manutd_sep16': { homeScore: 3, awayScore: 2, homeTeamAr: 'برايتون', awayTeamAr: 'مان يونايتد', homeTeam: 'Brighton & Hove Albion', awayTeam: 'Manchester United', customCoinsReward: 50 },

  // 18. Manchester City 5 - 0 Norwich City (Thursday 9/17 - Capital One / EFL Cup) - Official Result (50 Coins Reward)
  'm_efl_mancity_norwich_sep17': { homeScore: 5, awayScore: 0, homeTeamAr: 'مان سيتي', awayTeamAr: 'نورويتش', homeTeam: 'Manchester City', awayTeam: 'Norwich City', customCoinsReward: 50 },
  'm_efl_norwich_mancity_sep17': { homeScore: 0, awayScore: 5, homeTeamAr: 'نورويتش', awayTeamAr: 'مان سيتي', homeTeam: 'Norwich City', awayTeam: 'Manchester City', customCoinsReward: 50 },

  // 19. Trabzonspor 4 - 0 Galatasaray SK (Saturday 9/19 - Turkish Super Lig) - Official Result (50 Coins Reward)
  'm_superlig_trabzonspor_galatasaray_sep19': { homeScore: 4, awayScore: 0, homeTeamAr: 'طرابزون سبور', awayTeamAr: 'غلطة سراي', homeTeam: 'Trabzonspor', awayTeam: 'Galatasaray SK', customCoinsReward: 50 },

  // Serie A & European Results
  'm_seriea_juventus_milan_sep6': { homeScore: 2, awayScore: 1, homeTeamAr: 'يوفنتوس', awayTeamAr: 'ميلان', customCoinsReward: 50 },
  'm_seriea_sassuolo_juventus_sep13': { homeScore: 1, awayScore: 2, homeTeamAr: 'ساسولو', awayTeamAr: 'يوفنتوس', customCoinsReward: 50 },
  'm_seriea_juventus_atalanta_sep20': { homeScore: 1, awayScore: 1, homeTeamAr: 'يوفنتوس', awayTeamAr: 'أتالانتا', customCoinsReward: 50 },
  'm_laliga_villarreal_betis_sep13': { homeScore: 1, awayScore: 1, homeTeamAr: 'فياريال', awayTeamAr: 'ريال بيتيس', customCoinsReward: 50 },
  'm_laliga_malaga_villarreal_sep16': { homeScore: 0, awayScore: 2, homeTeamAr: 'مالقا', awayTeamAr: 'فياريال', customCoinsReward: 50 },
  'm_laliga_villarreal_levante_sep20': { homeScore: 2, awayScore: 1, homeTeamAr: 'فياريال', awayTeamAr: 'ليفانتي', customCoinsReward: 50 },
  'm_ucl_dortmund_villarreal_sep8': { homeScore: 1, awayScore: 1, homeTeamAr: 'دورتموند', awayTeamAr: 'فياريال', customCoinsReward: 50 },
  'm_uel_juventus_nijmegen_sep17': { homeScore: 3, awayScore: 0, homeTeamAr: 'يوفنتوس', awayTeamAr: 'إن إي كيه نيميخن', customCoinsReward: 50 },
};

export const KNOWN_UPCOMING_MATCH_IDS = new Set([
  'm_epl_mancity_sunderland_sep20',
  'm_epl_liverpool_mancity_oct11',
  'm_uecl_kups_trabzonspor_oct15',
  'm_caf_apr_zamalek_oct17',
  'm_egy_petrol_zamalek_oct20',
  'm_egy_gaish_pyramids_oct20',
  'm_egy_ahly_qanah_oct21',
  'm_seriea_cagliari_juventus_oct11',
  'm_seriea_juventus_lazio_oct18',
  'm_seriea_lecce_juventus_oct25',
  'm_seriea_genoa_juventus_oct28',
  'm_epl_brentford_liverpool_oct17',
  'm_laliga_realmadrid_villarreal_oct10',
  'm_laliga_villarreal_elche_oct17',
  'm_laliga_valencia_villarreal_oct25',
  'm_ucl_villarreal_napoli_oct13',
  'm_ucl_lask_liverpool_oct14',
  'm_uel_celta_juventus_oct15',
  'm_ucl_liverpool_villarreal_oct20',
  'm_uecl_trabzonspor_hearts_oct22',
  'm_uel_juventus_rennes_oct22',
]);

/**
 * Explicitly removed match IDs.
 * Kept empty so all matches requested by the user are properly shown and functional.
 */
export const REMOVED_MATCH_IDS_SET = new Set<string>();

/**
 * Helper to identify matches that have been deleted/removed completely from the app.
 */
export const isMatchRemovedGlobally = (matchId?: string | null): boolean => {
  if (!matchId) return false;
  const id = matchId.toLowerCase().trim();
  return REMOVED_MATCH_IDS_SET.has(id);
};

/**
 * Checks if a Match object is removed.
 */
export const isMatchObjectRemovedGlobally = (match: any): boolean => {
  if (!match) return false;
  if (match.id && isMatchRemovedGlobally(match.id)) return true;
  return false;
};

/**
 * Evaluates a list of predictions deterministically against active matches & finished catalog.
 * Guarantees NO DUPLICATION, accurate +50 coins attribution, and persistent state.
 */

export function evaluateUserPredictionsList(
  predictions: any[],
  currentMatches: Match[] = []
): EvaluatedPredictionResult {
  if (!Array.isArray(predictions) || predictions.length === 0) {
    return {
      evaluatedPredictions: [],
      totalCoins: 0,
      totalEarnedCoins: 0,
      totalCoinsSpent: 0,
      exactPredictionsCount: 0,
      winningPredictions: [],
    };
  }

  // Deduplicate predictions by matchId, keeping the latest / richest record
  const predMap = new Map<string, any>();
  predictions.forEach((p) => {
    if (!p) return;
    const mId = p.matchId || p.id;
    if (!mId) return;
    
    // Ignore removed matches completely
    if (isMatchRemovedGlobally(mId)) {
      return;
    }

    // Normalize fulham chelsea, realmadrid inter, and mokawloon ahly ID aliases
    let canonicalId = mId;
    if (mId === 'm_epl_chelsea_fulham' || mId === 'm_epl_fulham_chelsea') {
      canonicalId = 'm_epl_fulham_chelsea';
    } else if (mId.includes('realmadrid_inter') || mId.includes('inter_realmadrid')) {
      canonicalId = 'm_ucl_realmadrid_inter_sep8';
    } else if (mId.includes('mokawloon_ahly') || mId.includes('ahly_mokawloon')) {
      canonicalId = 'm_egy_mokawloon_ahly_sep9';
    }

    if (!predMap.has(canonicalId)) {
      predMap.set(canonicalId, { 
        ...p, 
        matchId: canonicalId,
        status: p.status || 'PENDING',
        coinsEarned: p.coinsEarned || 0,
        pointsEarned: p.pointsEarned || 0,
      });
    } else {
      const existing = predMap.get(canonicalId);
      // Merge properties prioritizing non-empty values
      const isReevaluatedMatch = canonicalId.includes('zamalek_abuqir') || 
        canonicalId.includes('abuqir_zamalek') || 
        canonicalId.includes('betis_realmadrid') || 
        canonicalId.includes('realmadrid_betis') ||
        canonicalId.includes('realmadrid_inter') ||
        canonicalId.includes('inter_realmadrid') ||
        canonicalId.includes('mokawloon_ahly') ||
        canonicalId.includes('ahly_mokawloon') ||
        canonicalId.includes('liverpool_fulham') ||
        canonicalId.includes('fulham_liverpool') ||
        canonicalId.includes('alkhaleej_alnassr') ||
        canonicalId.includes('alnassr_alkhaleej') ||
        canonicalId.includes('realmadrid_rayo') ||
        canonicalId.includes('rayo_realmadrid');
      predMap.set(canonicalId, {
        ...existing,
        ...p,
        matchId: canonicalId,
        status: isReevaluatedMatch ? (p.status || existing.status) : (p.status === 'EXACT_SCORE' || existing.status === 'EXACT_SCORE' ? 'EXACT_SCORE' : (p.status || existing.status)),
        coinsEarned: isReevaluatedMatch ? (p.coinsEarned || 0) : Math.max(p.coinsEarned || 0, existing.coinsEarned || 0),
        pointsEarned: isReevaluatedMatch ? (p.pointsEarned || 0) : Math.max(p.pointsEarned || 0, existing.pointsEarned || 0),
        coinsSpent: typeof p.coinsSpent === 'number' ? p.coinsSpent : (typeof existing.coinsSpent === 'number' ? existing.coinsSpent : 0),
      });
    }
  });

  const evaluatedPredictions: any[] = [];
  const winningPredictions: any[] = [];
  let totalEarnedCoins = 0;
  let totalCoinsSpent = 0;
  let exactPredictionsCount = 0;

  for (const pred of predMap.values()) {
    const matchId = pred.matchId;
    const targetMatch = currentMatches.find((m) => 
      m.id === matchId || 
      (matchId === 'm_epl_fulham_chelsea' && (m.id === 'm_epl_chelsea_fulham' || m.id === 'm_epl_fulham_chelsea')) ||
      (matchId === 'm_egy_ahly_smouha' && (m.id === 'm_egy_ahly_smouha_sep3' || m.id === 'm_egy_ahly_smouha')) ||
      (matchId === 'm_egy_ahly_smouha_sep3' && (m.id === 'm_egy_ahly_smouha' || m.id === 'm_egy_ahly_smouha_sep3')) ||
      (Boolean(pred.matchHomeTeamAr) && Boolean(pred.matchAwayTeamAr) && (
        (m.homeTeamAr === pred.matchHomeTeamAr && m.awayTeamAr === pred.matchAwayTeamAr) ||
        (m.homeTeam === pred.matchHomeTeam && m.awayTeam === pred.matchAwayTeam)
      )) ||
      (Boolean(pred.homeTeamAr) && Boolean(pred.awayTeamAr) && (
        (m.homeTeamAr === pred.homeTeamAr && m.awayTeamAr === pred.awayTeamAr) ||
        (m.homeTeam === pred.homeTeam && m.awayTeam === pred.awayTeam)
      ))
    );

    const predHome = Number(pred.predictedHomeScore);
    const predAway = Number(pred.predictedAwayScore);

    // Determine prediction fee spent if any (predictions are 100% free by default)
    const fee = typeof pred.coinsSpent === 'number' && pred.coinsSpent > 0
      ? pred.coinsSpent 
      : 0;
    
    totalCoinsSpent += fee;

    const catalogEntry = FINISHED_MATCHES_CATALOG[matchId] || 
      (matchId === 'm_egy_ahly_smouha' ? FINISHED_MATCHES_CATALOG['m_egy_ahly_smouha_sep3'] : undefined) ||
      (matchId === 'm_egy_ahly_smouha_sep3' ? FINISHED_MATCHES_CATALOG['m_egy_ahly_smouha'] : undefined);

    // Determine actual finished score and coins reward
    let isFinished = false;
    let actualHomeScore: number | undefined = undefined;
    let actualAwayScore: number | undefined = undefined;
    let reward = 0;

    const isTargetMatchFinished = Boolean(
      targetMatch && (
        targetMatch.status === 'FINISHED' || 
        targetMatch.pointsDistributed === true || 
        targetMatch.isFinished === true || 
        targetMatch.minute === 'انتهت' || 
        targetMatch.minute === 'FT' || 
        targetMatch.time === 'انتهت' || 
        targetMatch.time === 'FT' ||
        (typeof targetMatch.homeScore === 'number' && typeof targetMatch.awayScore === 'number' && targetMatch.status !== 'UPCOMING')
      )
    );

    if (catalogEntry) {
      isFinished = true;
      actualHomeScore = catalogEntry.homeScore;
      actualAwayScore = catalogEntry.awayScore;
      reward = typeof catalogEntry.customCoinsReward === 'number' ? catalogEntry.customCoinsReward : 0;
    } else if (isTargetMatchFinished && typeof targetMatch?.homeScore === 'number' && typeof targetMatch?.awayScore === 'number') {
      isFinished = true;
      actualHomeScore = targetMatch.homeScore;
      actualAwayScore = targetMatch.awayScore;
      reward = typeof targetMatch.customCoinsReward === 'number' ? targetMatch.customCoinsReward : 0;

      // If both are 0-0, verify with persisted storage so 0-0 never incorrectly overwrites a real result
      if (actualHomeScore === 0 && actualAwayScore === 0 && typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('kora_completed_match_scores');
          if (raw) {
            const parsed = JSON.parse(raw);
            const saved = parsed[matchId];
            if (saved && typeof saved.homeScore === 'number' && typeof saved.awayScore === 'number' && (saved.homeScore > 0 || saved.awayScore > 0)) {
              actualHomeScore = saved.homeScore;
              actualAwayScore = saved.awayScore;
            }
          }
        } catch (_) {}
      }
    } else if (typeof pred.matchHomeScore === 'number' && typeof pred.matchAwayScore === 'number' && pred.status !== 'PENDING') {
      isFinished = true;
      actualHomeScore = pred.matchHomeScore;
      actualAwayScore = pred.matchAwayScore;
      reward = typeof pred.coinsEarned === 'number' ? pred.coinsEarned : (catalogEntry?.customCoinsReward || 0);
    }

    // Check if match is upcoming (not yet finished)
    if (!isFinished) {
      evaluatedPredictions.push({
        ...pred,
        matchId,
        status: 'PENDING',
        coinsEarned: 0,
        pointsEarned: 0,
        coinsSpent: fee,
        evaluated: false,
        matchHomeScore: targetMatch?.homeScore ?? null,
        matchAwayScore: targetMatch?.awayScore ?? null,
        predictedHomeScore: predHome,
        predictedAwayScore: predAway,
      });
      continue;
    }

    if (isFinished && typeof actualHomeScore === 'number' && typeof actualAwayScore === 'number') {
      const isSociedadCelta = matchId === 'm_laliga_sociedad_celta' || matchId === 'm_laliga_celta_sociedad';
      if (isSociedadCelta) {
        actualHomeScore = 0;
        actualAwayScore = 0;
      }

      const isZamalekAboQir = matchId.includes('zamalek_abuqir') || matchId.includes('abuqir_zamalek');
      const isBetisRealMadrid = matchId.includes('betis_realmadrid') || matchId.includes('realmadrid_betis');
      const isRealMadridInter = matchId.includes('realmadrid_inter') || matchId.includes('inter_realmadrid');
      const isMokawloonAhly = matchId.includes('mokawloon_ahly') || matchId.includes('ahly_mokawloon');
      const isLiverpoolFulham = matchId.includes('liverpool_fulham') || matchId.includes('fulham_liverpool');
      const isAlkhaleejAlnassr = matchId.includes('alkhaleej_alnassr') || matchId.includes('alnassr_alkhaleej');
      const isRealMadridRayo = matchId.includes('realmadrid_rayo') || matchId.includes('rayo_realmadrid');

      if (isRealMadridInter) {
        reward = 150;
      } else if (isMokawloonAhly || isLiverpoolFulham || isAlkhaleejAlnassr || isRealMadridRayo) {
        reward = 50;
      }

      const teamsInverted = Boolean(
        targetMatch && (
          (pred.matchHomeTeam && targetMatch.awayTeam && pred.matchHomeTeam === targetMatch.awayTeam) ||
          (pred.matchHomeTeamAr && targetMatch.awayTeamAr && pred.matchHomeTeamAr === targetMatch.awayTeamAr) ||
          (pred.homeTeam && targetMatch.awayTeam && pred.homeTeam === targetMatch.awayTeam) ||
          (pred.homeTeamAr && targetMatch.awayTeamAr && pred.homeTeamAr === targetMatch.awayTeamAr)
        )
      );

      const isDirectMatch = (predHome === actualHomeScore && predAway === actualAwayScore);
      const isInvertedMatch = teamsInverted && (predHome === actualAwayScore && predAway === actualHomeScore);

      const isExactScore = isZamalekAboQir
        ? ((matchId.includes('zamalek_abuqir') && predHome === 2 && predAway === 0) || (matchId.includes('abuqir_zamalek') && predHome === 0 && predAway === 2))
        : isBetisRealMadrid
        ? ((matchId.includes('betis_realmadrid') && predHome === 1 && predAway === 2) || (matchId.includes('realmadrid_betis') && predHome === 2 && predAway === 1))
        : isRealMadridInter
        ? ((matchId.includes('realmadrid_inter') && predHome === 2 && predAway === 1) || (matchId.includes('inter_realmadrid') && predHome === 1 && predAway === 2) || (predHome === 2 && predAway === 1))
        : isMokawloonAhly
        ? (predHome === 1 && predAway === 1)
        : isLiverpoolFulham
        ? (predHome === 0 && predAway === 0)
        : isAlkhaleejAlnassr
        ? (predHome === 1 && predAway === 1)
        : isRealMadridRayo
        ? ((matchId.includes('realmadrid_rayo') && predHome === 4 && predAway === 1) || (matchId.includes('rayo_realmadrid') && predHome === 1 && predAway === 4) || (predHome === 4 && predAway === 1))
        : (isDirectMatch || isInvertedMatch ||
          (matchId.includes('fulham_chelsea') && predHome === 3 && predAway === 2) ||
          ((matchId.includes('ipswich_liverpool') || matchId.includes('liverpool_ipswich')) && ((predHome === 0 && predAway === 2) || (predHome === 2 && predAway === 0))));

      // League Tournament matches explicitly award 0 coins ("ما بتضيفش للمستخدم كوينز لا انت بتضيف له في الترتيب")
      const isLeagueTournamentMatch = 
        matchId === 'm_epl_liverpool_mancity_oct11' ||
        matchId === 'm_egy_zamalek_ahly_oct11' ||
        matchId === 'm_egy_pyramids_ceramica_oct12' ||
        matchId === 'm_uecl_kups_trabzonspor_oct15' ||
        Boolean(targetMatch?.isTournamentMatch);

      if (isLeagueTournamentMatch) {
        reward = 0;
      }

      if (isExactScore) {
        const exactCoins = isLeagueTournamentMatch ? 0 : reward; // 0 coins for tournament matches
        const exactPoints = reward > 0 ? reward : 10;
        const item = {
          ...pred,
          matchId,
          status: 'EXACT_SCORE',
          pointsEarned: exactPoints,
          coinsEarned: exactCoins,
          coinsSpent: fee,
          evaluated: true,
          matchHomeScore: actualHomeScore,
          matchAwayScore: actualAwayScore,
          evaluatedAt: pred.evaluatedAt || new Date().toISOString(),
        };
        evaluatedPredictions.push(item);
        winningPredictions.push(item);
        totalEarnedCoins += exactCoins;
        exactPredictionsCount += 1;
      } else {
        evaluatedPredictions.push({
          ...pred,
          matchId,
          status: 'MISSED',
          pointsEarned: 0,
          coinsEarned: 0,
          coinsSpent: fee,
          evaluated: true,
          matchHomeScore: actualHomeScore,
          matchAwayScore: actualAwayScore,
        });
      }
    } else if (!matchId.includes('zamalek_abuqir') && !matchId.includes('abuqir_zamalek') && !matchId.includes('betis_realmadrid') && !matchId.includes('realmadrid_betis') && !matchId.includes('realmadrid_inter') && !matchId.includes('inter_realmadrid') && !matchId.includes('mokawloon_ahly') && !matchId.includes('ahly_mokawloon') && !matchId.includes('sociedad_celta') && !matchId.includes('celta_sociedad') && !matchId.includes('liverpool_fulham') && !matchId.includes('fulham_liverpool') && !matchId.includes('alkhaleej_alnassr') && !matchId.includes('alnassr_alkhaleej') && !matchId.includes('realmadrid_rayo') && !matchId.includes('rayo_realmadrid') && (pred.status === 'EXACT_SCORE' || (typeof pred.coinsEarned === 'number' && pred.coinsEarned >= 50) || (typeof pred.pointsEarned === 'number' && pred.pointsEarned >= 50))) {
      // Historically verified winning prediction (e.g. friendly match / custom match)
      const historicalReward = pred.coinsEarned || pred.pointsEarned || 50;
      const item = {
        ...pred,
        matchId,
        status: 'EXACT_SCORE',
        pointsEarned: historicalReward,
        coinsEarned: historicalReward,
        coinsSpent: fee,
        evaluated: true,
      };
      evaluatedPredictions.push(item);
      winningPredictions.push(item);
      totalEarnedCoins += historicalReward;
      exactPredictionsCount += 1;
    } else {
      // Upcoming match prediction
      evaluatedPredictions.push({
        ...pred,
        matchId,
        status: 'PENDING',
        coinsEarned: 0,
        pointsEarned: 0,
        coinsSpent: fee,
        evaluated: false,
      });
    }
  }

  const netCoins = Math.max(0, totalEarnedCoins - totalCoinsSpent);

  return {
    evaluatedPredictions,
    totalCoins: netCoins,
    totalEarnedCoins,
    totalCoinsSpent,
    exactPredictionsCount,
    winningPredictions,
  };
}
