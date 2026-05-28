import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { BBSForm } from '../../../../../src/components/forms/BBSForm';
import { PASSForm } from '../../../../../src/components/forms/PASSForm';
import { TISForm } from '../../../../../src/components/forms/TISForm';
import { MASForm }  from '../../../../../src/components/forms/MASForm';
import { COVSForm } from '../../../../../src/components/forms/COVSForm';
import { FGAForm }  from '../../../../../src/components/forms/FGAForm';
import { HiMATForm } from '../../../../../src/components/forms/HiMAT';
import { SARAForm }      from '../../../../../src/components/forms/SARAForm';
import { StepTestForm } from '../../../../../src/components/forms/StepTest';
import { AMPForm }      from '../../../../../src/components/forms/AMPForm';
import { BOOMERForm }   from '../../../../../src/components/forms/BOOMER';
import { FSSForm }      from '../../../../../src/components/forms/FSSForm';
import { HADSForm }     from '../../../../../src/components/forms/HADSForm';
import { RPQForm }      from '../../../../../src/components/forms/RPQForm';
import { PDQ8Form }     from '../../../../../src/components/forms/PDQ8Form';
import { ABCForm }      from '../../../../../src/components/forms/ABCForm';
import { BIVIForm }     from '../../../../../src/components/forms/BIVIForm';
import { BarthelForm }  from '../../../../../src/components/forms/BarthelForm';
import { SCIMForm }     from '../../../../../src/components/forms/SCIMForm';
import { TUGForm }      from '../../../../../src/components/forms/TUGForm';
import { MWTForm }      from '../../../../../src/components/forms/MWTForm';
import { SixMWTForm }   from '../../../../../src/components/forms/SixMWTForm';
import { FACForm }      from '../../../../../src/components/forms/FACForm';
import { isValidUUID } from '../../../../../src/utils/routing';
import { Screen } from '../../../../../src/components/ui/Screen';
import { Card } from '../../../../../src/components/ui/Card';
import { NavyHeader } from '../../../../../src/components/ui/NavyHeader';
import { colors, spacing, typography } from '../../../../../src/theme/tokens';

const TUG_ID     = 'TUG';
const MWT_ID     = '10MWT';
const SMWT_ID    = '6MWT';
const FAC_ID     = 'FAC';
const BBS_ID     = 'BBS';
const PASS_ID    = 'PASS';
const TIS_ID     = 'TIS';
const MAS_ID     = 'MAS';
const COVS_ID    = 'COVS';
const FGA_ID     = 'FGA';
const HIMAT_ID   = 'HiMAT';
const SARA_ID    = 'SARA';
const STEP_ID    = 'Step';
const AMP_ID     = 'AMP';
const BOOMER_ID  = 'BOOMER';
const FSS_ID     = 'FSS';
const HADS_ID    = 'HADS';
const RPQ_ID     = 'RPQ';
const PDQ8_ID    = 'PDQ8';
const ABC_ID     = 'ABC';
const BIVI_ID    = 'BIVI';
const BARTHEL_ID = 'Barthel';
const SCIM_ID    = 'SCIM';

export default function AssessScreen() {
  const params = useLocalSearchParams<{ patientId: string; measureId: string }>();
  const rawPatientId = Array.isArray(params.patientId) ? params.patientId[0] : params.patientId;
  const measureId = Array.isArray(params.measureId) ? params.measureId[0] : params.measureId;
  const patientId = isValidUUID(rawPatientId) ? rawPatientId : null;

  if (!patientId || !measureId) {
    return (
      <Screen padded={false} rootBackground={colors.primaryDark} safeEdges={['top', 'left', 'right']}>
        <NavyHeader leftLabel="‹" onLeft={() => router.back()} />
        <View style={styles.stubContent}>
          <Card style={styles.messageCard}>
            <Text style={styles.messageText}>Invalid route parameters.</Text>
          </Card>
        </View>
      </Screen>
    );
  }

  if (measureId === TUG_ID)     return <TUGForm patientId={patientId} />;
  if (measureId === MWT_ID)     return <MWTForm patientId={patientId} />;
  if (measureId === SMWT_ID)    return <SixMWTForm patientId={patientId} />;
  if (measureId === FAC_ID)     return <FACForm patientId={patientId} />;
  if (measureId === BBS_ID)     return <BBSForm patientId={patientId} />;
  if (measureId === PASS_ID)    return <PASSForm patientId={patientId} />;
  if (measureId === TIS_ID)     return <TISForm patientId={patientId} />;
  if (measureId === MAS_ID)     return <MASForm patientId={patientId} />;
  if (measureId === COVS_ID)    return <COVSForm patientId={patientId} />;
  if (measureId === FGA_ID)     return <FGAForm patientId={patientId} />;
  if (measureId === HIMAT_ID)   return <HiMATForm patientId={patientId} />;
  if (measureId === SARA_ID)    return <SARAForm patientId={patientId} />;
  if (measureId === STEP_ID)    return <StepTestForm patientId={patientId} />;
  if (measureId === AMP_ID)     return <AMPForm patientId={patientId} />;
  if (measureId === BOOMER_ID)  return <BOOMERForm patientId={patientId} />;
  if (measureId === FSS_ID)     return <FSSForm patientId={patientId} />;
  if (measureId === HADS_ID)    return <HADSForm patientId={patientId} />;
  if (measureId === RPQ_ID)     return <RPQForm patientId={patientId} />;
  if (measureId === PDQ8_ID)    return <PDQ8Form patientId={patientId} />;
  if (measureId === ABC_ID)     return <ABCForm patientId={patientId} />;
  if (measureId === BIVI_ID)    return <BIVIForm patientId={patientId} />;
  if (measureId === BARTHEL_ID) return <BarthelForm patientId={patientId} />;
  if (measureId === SCIM_ID)    return <SCIMForm patientId={patientId} />;

  return (
    <Screen padded={false} rootBackground={colors.primaryDark} safeEdges={['top', 'left', 'right']}>
      <NavyHeader leftLabel="‹" onLeft={() => router.back()} />
      <View style={styles.stubContent}>
        <Card style={styles.messageCard}>
          <Text style={styles.messageText}>This measure is not available in the mobile app.</Text>
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stubContent: {
    flex: 1,
    padding: spacing.md,
  },
  messageCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  messageText: {
    fontSize: typography.sizeMd,
    color: colors.muted,
    textAlign: 'center',
  },
});
