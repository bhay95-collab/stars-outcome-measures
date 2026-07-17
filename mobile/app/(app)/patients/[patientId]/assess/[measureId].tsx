import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { BBSForm } from '../../../../../src/components/forms/BBSForm';
import { PASSForm } from '../../../../../src/components/forms/PASSForm';
import { TISForm } from '../../../../../src/components/forms/TISForm';
import { MASForm }  from '../../../../../src/components/forms/MASForm';
import { COVSForm } from '../../../../../src/components/forms/COVSForm';
import { FGAForm }  from '../../../../../src/components/forms/FGAForm';
import { HiMATForm } from '../../../../../src/components/forms/HiMAT/HiMATForm';
import { SARAForm }      from '../../../../../src/components/forms/SARAForm';
import { StepTestForm } from '../../../../../src/components/forms/StepTest/StepTestForm';
import { AMPForm }      from '../../../../../src/components/forms/AMPForm';
import { BOOMERForm }   from '../../../../../src/components/forms/BOOMER/BOOMERForm';
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
import { NPRSForm }     from '../../../../../src/components/forms/NPRSForm';
import { PSFSForm }     from '../../../../../src/components/forms/PSFSForm';
import { LEFSForm }     from '../../../../../src/components/forms/LEFSForm';
import { BPFSForm }     from '../../../../../src/components/forms/BPFSForm';
import { FAAMForm }     from '../../../../../src/components/forms/FAAMForm';
import { CAITForm }     from '../../../../../src/components/forms/CAITForm';
import { ATRSForm }     from '../../../../../src/components/forms/ATRSForm';
import { FABQForm }     from '../../../../../src/components/forms/FABQForm';
import { OMASForm }     from '../../../../../src/components/forms/OMASForm';
import { STS30Form }    from '../../../../../src/components/forms/STS30Form';
import { ACLSignsForm } from '../../../../../src/components/forms/ACLSignsForm';
import { QuadLSIForm }  from '../../../../../src/components/forms/QuadLSIForm';
import { HopBatteryForm } from '../../../../../src/components/forms/HopBatteryForm';
import { LESSForm }     from '../../../../../src/components/forms/LESSForm';
import { FTSTSForm }    from '../../../../../src/components/forms/FTSTSForm';
import { CMSForm }      from '../../../../../src/components/forms/CMSForm';
import { HHSForm }      from '../../../../../src/components/forms/HHSForm';
import { isMobileMeasureSupported } from '../../../../../src/clinical/mobileMeasures';
import type { MobileSupportedMeasureId } from '../../../../../src/clinical/mobileMeasures';
import { isValidUUID } from '../../../../../src/utils/routing';
import { Screen } from '../../../../../src/components/ui/Screen';
import { Card } from '../../../../../src/components/ui/Card';
import { NavyHeader } from '../../../../../src/components/ui/NavyHeader';
import { colors, spacing, typography } from '../../../../../src/theme/tokens';

type MeasureFormComponent = React.ComponentType<{ patientId: string }>;

const FORM_COMPONENTS: Record<MobileSupportedMeasureId, MeasureFormComponent> = {
  TUG: TUGForm,
  '10MWT': MWTForm,
  '6MWT': SixMWTForm,
  FAC: FACForm,
  BBS: BBSForm,
  PASS: PASSForm,
  TIS: TISForm,
  MAS: MASForm,
  COVS: COVSForm,
  FGA: FGAForm,
  HiMAT: HiMATForm,
  SARA: SARAForm,
  Step: StepTestForm,
  AMP: AMPForm,
  BOOMER: BOOMERForm,
  FSS: FSSForm,
  HADS: HADSForm,
  RPQ: RPQForm,
  PDQ8: PDQ8Form,
  ABC: ABCForm,
  BIVI: BIVIForm,
  Barthel: BarthelForm,
  SCIM: SCIMForm,
  NPRS: NPRSForm,
  PSFS: PSFSForm,
  LEFS: LEFSForm,
  BPFS: BPFSForm,
  FAAM: FAAMForm,
  CAIT: CAITForm,
  ATRS: ATRSForm,
  FABQ: FABQForm,
  OMAS: OMASForm,
  '30STS': STS30Form,
  ACLSigns: ACLSignsForm,
  QuadLSI: QuadLSIForm,
  HopBattery: HopBatteryForm,
  LESS: LESSForm,
  FTSTS: FTSTSForm,
  CMS: CMSForm,
  HHS: HHSForm,
};

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

  if (isMobileMeasureSupported(measureId)) {
    const FormComponent = FORM_COMPONENTS[measureId];
    return <FormComponent patientId={patientId} />;
  }

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
