import {
    AdMob,
    BannerAdSize,
    BannerAdPosition,
    RewardAdPluginEvents,
    AdLoadInfo,
    AdMobRewardItem, RewardAdOptions
} from '@capacitor-community/admob';



export async function initAdMob() {
    await AdMob.initialize({
        requestTrackingAuthorization: true, // iOS 14+
        initializeForTesting: false, // false in production
    });
    console.log('✅ AdMob initialized');
}

export async function showBanner(adId?: string) {
    await AdMob.showBanner({
        adId: adId || 'ca-app-pub-3940256099942544/6300978111', // test banner
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
    });
    console.log('📢 Banner shown');
}

export async function hideBanner() {
    await AdMob.hideBanner();
    console.log('🚫 Banner hidden');
}

export async function showInterstitial(adId?: string) {
    await AdMob.prepareInterstitial({
        adId: adId || 'ca-app-pub-3940256099942544/1033173712',
    });
    await AdMob.showInterstitial();
    console.log('🎬 Interstitial shown');
}

/*
export async function showRewarded(adId?: string, callback?: (reward: any) => void) {
    try {


        // Prepare the Rewarded Ad
        const result = await RewardAd.prepare({
            adId: adId || 'ca-app-pub-3940256099942544/5224354917', // test ad ID
            isTesting: true,
        });
        console.log('✅ Reward ad prepared:', result);

        // Add listener before showing ad
        const rewardListener = RewardAd.addListener('onRewarded', (reward) => {
            console.log('🏆 User earned reward:', reward);
            if (callback) callback(reward);
            rewardListener.remove(); // Clean up after use
        });

        const dismissListener = RewardAd.addListener('onAdDismissed', () => {
            console.log('❌ Reward ad closed');
            dismissListener.remove();
        });

        // Show the ad
        await RewardAd.show();
        console.log('🎬 Reward ad shown');
    } catch (err) {
        console.error('⚠️ Error showing rewarded ad:', err);
    }
}*/

export async function showRewarded(adId?: string, callback?: (reward: any) => void) {
    AdMob.addListener(RewardAdPluginEvents.Loaded, (info: AdLoadInfo) => {
        // Subscribe prepared rewardVideo
    });

    AdMob.addListener(
        RewardAdPluginEvents.Rewarded,
        (rewardItem: AdMobRewardItem) => {
            // Subscribe user rewarded
            console.log(rewardItem);
            if (callback) callback(rewardItem);
        },
    );

    const options: RewardAdOptions = {
        adId: adId || 'ca-app-pub-3940256099942544/5224354917',
         isTesting: false
        // npa: true
        // immersiveMode: true
        // ssv: {
        //   userId: "A user ID to send to your SSV"
        //   customData: JSON.stringify({ ...MyCustomData })
        //}
    };
    await AdMob.prepareRewardVideoAd(options);
    const rewardItem = await AdMob.showRewardVideoAd();
    //if (callback) callback(rewardItem);

}
